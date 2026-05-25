import { createHash } from 'node:crypto';
import { getSettings, SETTING_KEYS } from './settings';

/**
 * Cliente Mondial Relay (España) — API SOAP pública.
 *
 * Endpoint:     https://api.mondialrelay.com/Web_Services.asmx
 * Namespace:    http://www.mondialrelay.fr/webservice/
 *
 * Cómo funciona la autenticación:
 *  - Tu cuenta Mondial Relay te da 2 datos: ENSEIGNE (código comercial,
 *    p.ej. 'BDTEST') y PRIVATE_KEY (clave privada).
 *  - Cada petición SOAP concatena TODOS los valores de los parámetros en
 *    orden + la PRIVATE_KEY al final, calcula MD5 de esa cadena, y lo
 *    envía en el campo <Security> en MAYÚSCULAS.
 *
 * Credenciales de prueba públicas (sandbox):
 *   Enseigne:    BDTEST
 *   PrivateKey:  PrivateK
 *
 * Para producción contactar con tu Account Manager de Mondial Relay/InPost.
 */

// URL del WebService SOAP. Mondial Relay expone DOS variantes públicas:
//   - https://api.mondialrelay.com/WebService.asmx     (la que muestra el panel del usuario)
//   - https://api.mondialrelay.com/Web_Services.asmx   (legacy, también funciona)
// Usamos la que aparece literalmente en el portal del cliente.
const SOAP_URL = 'https://api.mondialrelay.com/WebService.asmx';
const NAMESPACE = 'http://www.mondialrelay.fr/webservice/';

// ===========================================================================
// CONFIG
// ===========================================================================

export interface MondialRelayConfig {
  enseigne: string;
  privateKey: string;
  mode: 'test' | 'production';
  enabled: boolean;
  sender: {
    name: string;
    street: string;
    city: string;
    cp: string;
    country: string;
    phone: string;
    email: string;
  };
  deliveryMode: string;     // '24R' (punto/locker), 'LD1' (domicilio), etc.
  defaultWeightG: number;
}

export async function getMondialRelayConfig(): Promise<MondialRelayConfig> {
  const s = await getSettings();
  return {
    enseigne: (s[SETTING_KEYS.SHIPPING_MR_ENSEIGNE] ?? '').trim(),
    privateKey: (s[SETTING_KEYS.SHIPPING_MR_PRIVATE_KEY] ?? '').trim(),
    mode: s[SETTING_KEYS.SHIPPING_MR_MODE] === 'production' ? 'production' : 'test',
    enabled: (s[SETTING_KEYS.SHIPPING_MR_ENABLED] ?? 'false') === 'true',
    sender: {
      name: s[SETTING_KEYS.SHIPPING_MR_SENDER_NAME] ?? 'Lomhifar',
      street: s[SETTING_KEYS.SHIPPING_MR_SENDER_STREET] ?? '',
      city: s[SETTING_KEYS.SHIPPING_MR_SENDER_CITY] ?? '',
      cp: s[SETTING_KEYS.SHIPPING_MR_SENDER_CP] ?? '',
      country: s[SETTING_KEYS.SHIPPING_MR_SENDER_COUNTRY] ?? 'ES',
      phone: s[SETTING_KEYS.SHIPPING_MR_SENDER_PHONE] ?? '',
      email: s[SETTING_KEYS.SHIPPING_MR_SENDER_EMAIL] ?? '',
    },
    deliveryMode: s[SETTING_KEYS.SHIPPING_MR_DELIVERY_MODE] ?? '24R',
    defaultWeightG: Number(s[SETTING_KEYS.SHIPPING_MR_DEFAULT_WEIGHT_G] ?? '100') || 100,
  };
}

// ===========================================================================
// HELPERS DE FIRMA + SOAP
// ===========================================================================

/**
 * Calcula el hash MD5 (uppercase) de la concatenación de TODOS los values
 * en el orden en que aparecen en `params` + la privateKey al final.
 * Es el algoritmo oficial de Mondial Relay para validar la integridad de
 * la petición.
 */
function computeSecurity(params: Record<string, string>, privateKey: string): string {
  const concat = Object.values(params).join('') + privateKey;
  return createHash('md5').update(concat, 'utf8').digest('hex').toUpperCase();
}

/** Escapa caracteres reservados de XML. */
function xmlEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Construye el body SOAP con todos los parámetros + la firma de seguridad. */
function buildSoapEnvelope(method: string, params: Record<string, string>): string {
  const fields = Object.entries(params)
    .map(([k, v]) => `<${k}>${xmlEscape(v)}</${k}>`)
    .join('');
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="${NAMESPACE}">${fields}</${method}>
  </soap:Body>
</soap:Envelope>`;
}

/** Extrae el valor de un nodo XML simple (la API devuelve estructuras planas). */
function extractTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m?.[1]?.trim();
}

/** Ejecuta una petición SOAP y devuelve el XML de respuesta. */
async function soapCall(method: string, params: Record<string, string>): Promise<string> {
  const body = buildSoapEnvelope(method, params);

  // IMPORTANTE: SOAPAction debe ir ENTRE COMILLAS DOBLES (SOAP 1.1 / RFC).
  // Mondial Relay (ASMX/.NET) lo enforza estrictamente: sin comillas
  // devuelve HTTP 500 \"Le serveur n'a pas reconnu la valeur de l'en-tête\".
  // Usamos Headers explícito para evitar que algún normalizador de undici
  // toque las comillas.
  const headers = new Headers();
  headers.set('Content-Type', 'text/xml; charset=utf-8');
  headers.set('SOAPAction', `"${NAMESPACE}${method}"`);
  headers.set('Accept', 'text/xml, application/xml, */*');

  const res = await fetch(SOAP_URL, {
    method: 'POST',
    headers,
    body,
    // Evitar cualquier cache: cada llamada es única.
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Mondial Relay HTTP ${res.status}: ${await res.text().catch(() => '')}`);
  }
  return await res.text();
}

/**
 * Wrapper que prepara params + Security, invoca y parsea el STAT (status code).
 * STAT="0" = OK. Otros valores = error documentado por Mondial Relay.
 */
async function call<T extends Record<string, string>>(
  method: string,
  paramsWithoutSecurity: T,
  privateKey: string,
): Promise<{ ok: true; xml: string } | { ok: false; status: string; xml: string }> {
  const security = computeSecurity(paramsWithoutSecurity, privateKey);
  const params = { ...paramsWithoutSecurity, Security: security };
  const xml = await soapCall(method, params);
  const stat = extractTag(xml, 'STAT') ?? extractTag(xml, 'Stat') ?? '0';
  if (stat === '0') return { ok: true, xml };
  return { ok: false, status: stat, xml };
}

// ===========================================================================
// API PÚBLICA — métodos que usaremos desde la app
// ===========================================================================

/**
 * Test de conexión: invoca un endpoint inocuo (búsqueda de punto cerca
 * de un CP) para verificar que las credenciales son válidas. Si la
 * llamada vuelve con STAT="0" o cualquier otro status, sabemos que el
 * canal funciona y la firma se acepta.
 */
export async function testConnection(): Promise<{ ok: boolean; message: string; status?: string }> {
  const cfg = await getMondialRelayConfig();
  if (!cfg.enseigne || !cfg.privateKey) {
    return { ok: false, message: 'Faltan credenciales (Enseigne y PrivateKey) en /admin/configuracion.' };
  }
  try {
    const result = await call(
      'WSI3_PointRelais_Recherche',
      {
        Enseigne: cfg.enseigne,
        Pays: 'ES',
        CP: '28013', // CP de prueba (Madrid centro)
      },
      cfg.privateKey,
    );
    if (result.ok) {
      return { ok: true, message: '✓ Conexión correcta con Mondial Relay. La firma se valida bien.' };
    }
    return {
      ok: false,
      status: result.status,
      message: `Mondial Relay rechazó la petición (STAT="${result.status}"). Revisa Enseigne / PrivateKey en /admin/configuracion.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? `Error de red: ${e.message}` : 'Error desconocido',
    };
  }
}

export interface PickupPoint {
  id: string;          // Num
  name: string;        // LgAdr1
  street?: string;     // LgAdr3
  cp?: string;         // CP
  city?: string;       // Ville
  country?: string;    // Pays
  distance?: number;   // Distance en metros (cuando se busca por CP)
  lat?: number;        // Latitude
  lng?: number;        // Longitude
}

/**
 * Busca puntos de recogida (Punto Pack / Locker) cerca de un código postal.
 * Útil para que el cliente pueda elegir dónde recoger su pedido.
 */
export async function findPickupPoints(
  cp: string,
  countryISO2 = 'ES',
  maxResults = 5,
): Promise<PickupPoint[]> {
  const cfg = await getMondialRelayConfig();
  if (!cfg.enseigne || !cfg.privateKey) throw new Error('Mondial Relay no configurado');

  const result = await call(
    'WSI3_PointRelais_Recherche',
    {
      Enseigne: cfg.enseigne,
      Pays: countryISO2,
      CP: cp,
      NombreResultats: String(maxResults),
    },
    cfg.privateKey,
  );

  if (!result.ok) {
    throw new Error(`Mondial Relay error STAT="${result.status}"`);
  }

  // Las respuestas vienen en <PointsRelais><PointRelais_Details>...</></>
  const blocks = result.xml.match(/<PointRelais_Details>[\s\S]*?<\/PointRelais_Details>/gi) ?? [];
  return blocks.map((b): PickupPoint => ({
    id: extractTag(b, 'Num') ?? '',
    name: extractTag(b, 'LgAdr1') ?? '',
    street: extractTag(b, 'LgAdr3'),
    cp: extractTag(b, 'CP'),
    city: extractTag(b, 'Ville'),
    country: extractTag(b, 'Pays'),
    distance: extractTag(b, 'Distance') ? Number(extractTag(b, 'Distance')) : undefined,
    lat: extractTag(b, 'Latitude') ? Number((extractTag(b, 'Latitude') ?? '').replace(',', '.')) : undefined,
    lng: extractTag(b, 'Longitude') ? Number((extractTag(b, 'Longitude') ?? '').replace(',', '.')) : undefined,
  })).filter((p) => p.id);
}

export interface CreateShipmentInput {
  // Datos del destinatario (cliente)
  destName: string;          // Razón social / nombre (max 32 chars)
  destStreet: string;        // Calle + nº (max 32 chars)
  destCity: string;
  destCP: string;
  destCountry?: string;      // 'ES' por defecto
  destPhone: string;
  destEmail: string;
  // Modalidad
  modeLiv?: string;          // '24R' (punto/locker, requiere relayId) | 'LD1' | 'LDS'
  relayId?: string;          // Solo si modeLiv='24R' — id del punto de recogida
  relayCountry?: string;     // Solo si modeLiv='24R' — país del punto ('ES')
  // Peso del paquete en gramos (default: el del setting)
  weightG?: number;
  // Referencia interna del pedido (aparecerá en etiqueta)
  reference: string;
}

export interface CreateShipmentResult {
  ok: boolean;
  trackingNumber?: string;
  labelUrl?: string;         // PDF de la etiqueta (URL pública de MR)
  status?: string;
  errorMessage?: string;
}

/**
 * Crea un envío (expedición) en Mondial Relay. Devuelve el nº de tracking
 * y la URL del PDF de la etiqueta para imprimir.
 *
 * Método SOAP: WSI4_CreationExpedition
 */
export async function createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  const cfg = await getMondialRelayConfig();
  if (!cfg.enseigne || !cfg.privateKey) {
    return { ok: false, errorMessage: 'Mondial Relay no configurado' };
  }
  if (!cfg.enabled) {
    return { ok: false, errorMessage: 'Mondial Relay desactivado en /admin/configuracion' };
  }

  const modeLiv = input.modeLiv ?? cfg.deliveryMode;
  const weight = input.weightG ?? cfg.defaultWeightG;

  // ORDEN IMPORTANTE: Mondial Relay calcula la firma concatenando los
  // VALORES en el ORDEN en que se construye el objeto. NO CAMBIES el
  // orden de las claves a la ligera.
  const params: Record<string, string> = {
    Enseigne: cfg.enseigne,
    ModeCol: 'CCC',                 // CCC = colecta en domicilio del remitente
    ModeLiv: modeLiv,               // 24R | LD1 | LDS
    NDossier: input.reference.slice(0, 15),
    NClient: '',
    Expe_Langage: 'ES',
    Expe_Ad1: clean(cfg.sender.name, 32),
    Expe_Ad2: '',
    Expe_Ad3: clean(cfg.sender.street, 32),
    Expe_Ad4: '',
    Expe_Ville: clean(cfg.sender.city, 26),
    Expe_CP: cfg.sender.cp,
    Expe_Pays: cfg.sender.country,
    Expe_Tel1: cfg.sender.phone.replace(/\s+/g, ''),
    Expe_Tel2: '',
    Expe_Mail: cfg.sender.email,
    Dest_Langage: 'ES',
    Dest_Ad1: clean(input.destName, 32),
    Dest_Ad2: '',
    Dest_Ad3: clean(input.destStreet, 32),
    Dest_Ad4: '',
    Dest_Ville: clean(input.destCity, 26),
    Dest_CP: input.destCP,
    Dest_Pays: input.destCountry ?? 'ES',
    Dest_Tel1: input.destPhone.replace(/\s+/g, ''),
    Dest_Tel2: '',
    Dest_Mail: input.destEmail,
    Poids: String(Math.max(50, Math.min(70000, weight))),  // gramos, 50g - 70kg
    NbColis: '1',
    CRT_Valeur: '0',
    CRT_Devise: 'EUR',
    Exp_Valeur: '0',
    Exp_Devise: 'EUR',
    COL_Rel_Pays: '',
    COL_Rel: '',
    LIV_Rel_Pays: modeLiv === '24R' ? (input.relayCountry ?? 'ES') : '',
    LIV_Rel: modeLiv === '24R' ? (input.relayId ?? '') : '',
    TAvisage: '',
    TReprise: '',
    Montage: '',
    TRDV: '',
    Assurance: '',
    Instructions: '',
    Texte: '',
  };

  try {
    const result = await call('WSI4_CreationExpedition', params, cfg.privateKey);
    const trackingNumber = extractTag(result.xml, 'ExpeditionNum') ?? extractTag(result.xml, 'NumExpedition');
    const labelUrl = extractTag(result.xml, 'URL_Etiquette');

    if (!result.ok) {
      return {
        ok: false,
        status: result.status,
        errorMessage: mondialRelayStatusText(result.status),
      };
    }
    if (!trackingNumber) {
      return { ok: false, errorMessage: 'Respuesta sin número de expedición' };
    }
    return {
      ok: true,
      trackingNumber,
      // La URL de etiqueta es relativa al dominio de MR, la convertimos a absoluta
      labelUrl: labelUrl ? toAbsoluteLabelUrl(labelUrl) : undefined,
    };
  } catch (e) {
    return { ok: false, errorMessage: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

function clean(s: string, max: number): string {
  return String(s ?? '').trim().slice(0, max);
}

function toAbsoluteLabelUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://www.mondialrelay.com${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Tracking público (URL para que el cliente siga su envío).
 * Es la misma URL que se le muestra en /tienda/pedidos/[id].
 */
export function buildPublicTrackingUrl(trackingNumber: string): string {
  return `https://www.mondialrelay.com/suivi-de-colis?numeroExpedition=${encodeURIComponent(trackingNumber)}`;
}

/**
 * Lookup del texto humano para un código STAT devuelto por Mondial Relay.
 * Lista oficial (extracto de los más comunes).
 */
function mondialRelayStatusText(code: string): string {
  const map: Record<string, string> = {
    '0': 'OK',
    '1': 'Enseigne inválida',
    '2': 'Número de cliente vacío o erróneo',
    '3': 'Idioma incorrecto',
    '5': 'País del destinatario incorrecto',
    '7': 'Nombre del destinatario incorrecto',
    '8': 'Dirección del destinatario (línea 3) incorrecta',
    '9': 'CP del destinatario incorrecto',
    '10': 'Ciudad del destinatario incorrecta',
    '11': 'Email del destinatario incorrecto',
    '13': 'Teléfono del destinatario incorrecto',
    '24': 'Peso inválido (50g - 70kg)',
    '26': 'Número de paquetes inválido',
    '30': 'Modo de entrega no permitido para esta enseigne',
    '31': 'Modo de recogida inválido',
    '33': 'Punto de recogida (LIV_Rel) inválido',
    '34': 'País del punto (LIV_Rel_Pays) inválido',
    '60': 'Acción no autorizada (consultar Mondial Relay)',
    '94': 'Sin envío encontrado',
    '95': 'Error de cuenta — contactar con Mondial Relay',
    '97': 'Error firma — revisar PrivateKey y orden de parámetros',
    '98': 'Error general',
    '99': 'Error genérico de sistema',
  };
  return map[code] ?? `Error Mondial Relay (STAT=${code})`;
}

// ===========================================================================
// CONFIGURACIÓN DE CARRIERS — registrar MR en la lista
// ===========================================================================

/** Devuelve si Mondial Relay está activo (credenciales rellenadas + toggle ON). */
export async function isMondialRelayEnabled(): Promise<boolean> {
  const cfg = await getMondialRelayConfig();
  return Boolean(cfg.enabled && cfg.enseigne && cfg.privateKey);
}
