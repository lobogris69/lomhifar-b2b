/**
 * Cliente de la API REST de Correos España (plataforma NUEVA vía Correos ID).
 *
 * Sustituye a la vieja API SOAP (apagada por Correos el 1-feb-2026). La auth
 * es en DOS pasos:
 *
 *  1) TOKEN (OAuth client_credentials contra Correos ID):
 *       POST https://apioauthcid.correos.es/Api/Authorize/Token
 *       body x-www-form-urlencoded:
 *         grant_type=client_credentials
 *         client_id={CORREOS_CLIENT_ID}
 *         client_secret={CORREOS_CLIENT_SECRET}
 *         scope="AP3 LBS RCG"
 *       → respuesta JSON, campo `idToken` = JWT (dura ~30 min en producción).
 *
 *  2) LLAMADA A LA API (gateway api1.correos.es) con TRES cabeceras:
 *         Authorization: Bearer {idToken}
 *         client_id:     {gateway client_id}
 *         client_secret: {gateway client_secret}
 *     Por defecto las credenciales del gateway = las de Correos ID (mismo
 *     par). Si Correos exigiera un par distinto del portal de desarrolladores,
 *     se ponen aparte con CORREOS_GATEWAY_CLIENT_ID / _SECRET.
 *
 * APIs disponibles (matriz oficial):
 *   - preregister  https://api1.correos.es/admissions/preregister/api/v1  (prerregistro de envío)
 *   - labels       https://api1.correos.es/support/labels/api/v1          (etiqueta PDF)
 *   - trackpub     https://api1.correos.es/support/trackpub/api/v2        (seguimiento)
 *
 * Datos del contrato de Lomhifar (email de Correos, 3-sep-2026):
 *   nº contrato 54099830 · nº cliente 81629568 · cód. etiquetador DHD4
 * Se leen de env (no van en código) para poder cambiarlos sin desplegar.
 *
 * Documentación reconstruida del portal MuleSoft de Correos y del SDK abierto
 * smart-dato/correos-shipping-sdk (MIT). De momento esta capa cubre TOKEN +
 * SEGUIMIENTO; el prerregistro/etiqueta se añadirá en una segunda fase.
 */

const DEFAULTS = {
  tokenUrl: 'https://apioauthcid.correos.es/Api/Authorize/Token',
  scope: 'AP3 LBS RCG',
  preregisterBase: 'https://api1.correos.es/admissions/preregister/api/v1',
  labelsBase: 'https://api1.correos.es/support/labels/api/v1',
  trackingBase: 'https://api1.correos.es/support/trackpub/api/v2',
};

export interface CorreosConfig {
  oauthClientId: string;
  oauthClientSecret: string;
  gatewayClientId: string;
  gatewayClientSecret: string;
  tokenUrl: string;
  scope: string;
  trackingBase: string;
  preregisterBase: string;
  labelsBase: string;
  contractNumber: string;
  clientNumber: string;
  labellerCode: string;
}

/** Lee la configuración desde variables de entorno (Railway). */
export function getCorreosConfig(): CorreosConfig {
  const oauthClientId = (process.env.CORREOS_CLIENT_ID ?? '').trim();
  const oauthClientSecret = (process.env.CORREOS_CLIENT_SECRET ?? '').trim();
  return {
    oauthClientId,
    oauthClientSecret,
    // El gateway usa por defecto el MISMO par que Correos ID. Solo se separan
    // si Correos entrega un client_id/secret distinto para el gateway.
    gatewayClientId: (process.env.CORREOS_GATEWAY_CLIENT_ID ?? oauthClientId).trim(),
    gatewayClientSecret: (process.env.CORREOS_GATEWAY_CLIENT_SECRET ?? oauthClientSecret).trim(),
    tokenUrl: (process.env.CORREOS_TOKEN_URL ?? DEFAULTS.tokenUrl).trim(),
    scope: (process.env.CORREOS_OAUTH_SCOPE ?? DEFAULTS.scope).trim(),
    trackingBase: (process.env.CORREOS_TRACKING_URL ?? DEFAULTS.trackingBase).trim().replace(/\/+$/, ''),
    preregisterBase: (process.env.CORREOS_PREREGISTER_URL ?? DEFAULTS.preregisterBase).trim().replace(/\/+$/, ''),
    labelsBase: (process.env.CORREOS_LABELS_URL ?? DEFAULTS.labelsBase).trim().replace(/\/+$/, ''),
    contractNumber: (process.env.CORREOS_NUM_CONTRATO ?? '').trim(),
    clientNumber: (process.env.CORREOS_NUM_CLIENTE ?? '').trim(),
    labellerCode: (process.env.CORREOS_COD_ETIQUETADOR ?? '').trim(),
  };
}

/** true si están las credenciales mínimas para pedir un token. */
export function isCorreosConfigured(): boolean {
  const c = getCorreosConfig();
  return Boolean(c.oauthClientId && c.oauthClientSecret);
}

/** true si además están los datos del contrato (necesarios para prerregistrar). */
export function isCorreosContractReady(): boolean {
  const c = getCorreosConfig();
  return Boolean(c.contractNumber && c.clientNumber && c.labellerCode);
}

// ---------------------------------------------------------------------------
// TOKEN (con caché en memoria del proceso)
// ---------------------------------------------------------------------------

interface CachedToken {
  token: string;
  expiresAt: number; // epoch segundos
}
let tokenCache: CachedToken | null = null;

const EXPIRY_BUFFER_SECONDS = 60;
const FALLBACK_TTL_SECONDS = 1500; // 25 min si el JWT no trae `exp`

/** Decodifica el claim `exp` (epoch seg) del JWT, o null si no se puede. */
function jwtExpiry(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export class CorreosError extends Error {
  constructor(message: string, readonly status?: number, readonly body?: string) {
    super(message);
    this.name = 'CorreosError';
  }
}

/**
 * Obtiene un token válido de Correos ID (client_credentials), cacheado hasta
 * su expiración. Lanza CorreosError con el detalle del servidor si falla.
 */
export async function getCorreosToken(force = false): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (!force && tokenCache && tokenCache.expiresAt - EXPIRY_BUFFER_SECONDS > now) {
    return tokenCache.token;
  }

  const c = getCorreosConfig();
  if (!c.oauthClientId || !c.oauthClientSecret) {
    throw new CorreosError('Faltan CORREOS_CLIENT_ID / CORREOS_CLIENT_SECRET en Railway.');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: c.oauthClientId,
    client_secret: c.oauthClientSecret,
    scope: c.scope,
  });

  let res: Response;
  try {
    res = await fetch(c.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
      cache: 'no-store',
    });
  } catch (e) {
    throw new CorreosError(`No se pudo conectar con Correos ID: ${e instanceof Error ? e.message : String(e)}`);
  }

  const raw = await res.text();
  if (!res.ok) {
    throw new CorreosError(
      `Correos ID rechazó las credenciales (HTTP ${res.status}).`,
      res.status,
      raw.slice(0, 500),
    );
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new CorreosError('Correos ID devolvió una respuesta no-JSON al pedir el token.', res.status, raw.slice(0, 300));
  }

  const token =
    (typeof data.idToken === 'string' && data.idToken) ||
    (typeof data.access_token === 'string' && data.access_token) ||
    (typeof data.token === 'string' && data.token) ||
    '';
  if (!token) {
    throw new CorreosError('Correos ID no devolvió `idToken` en la respuesta.', res.status, raw.slice(0, 300));
  }

  const exp = jwtExpiry(token);
  tokenCache = {
    token,
    expiresAt: exp ?? now + FALLBACK_TTL_SECONDS,
  };
  return token;
}

/** Cabeceras de auth para las llamadas al gateway api1.correos.es. */
async function gatewayHeaders(): Promise<Record<string, string>> {
  const c = getCorreosConfig();
  const token = await getCorreosToken();
  return {
    Authorization: `Bearer ${token}`,
    client_id: c.gatewayClientId,
    client_secret: c.gatewayClientSecret,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

// ---------------------------------------------------------------------------
// SEGUIMIENTO (trackpub v2)
// ---------------------------------------------------------------------------

export interface TrackingEvent {
  date?: string;
  code?: string;
  text?: string;
  location?: string;
}

export interface TrackingResult {
  code: string;
  product?: string;
  senderName?: string;
  addresseeName?: string;
  events: TrackingEvent[];
  raw: unknown;
}

/**
 * Consulta el seguimiento de un envío por su código (shippingCode).
 *   GET {trackingBase}/search/{code}
 * Devuelve los eventos normalizados. Lanza CorreosError si el gateway
 * rechaza la auth o el envío no existe.
 */
export async function trackShipment(shippingCode: string): Promise<TrackingResult> {
  const c = getCorreosConfig();
  const code = shippingCode.trim();
  const url = `${c.trackingBase}/search/${encodeURIComponent(code)}`;

  const res = await fetch(url, { method: 'GET', headers: await gatewayHeaders(), cache: 'no-store' });
  const raw = await res.text();

  if (!res.ok) {
    throw new CorreosError(`Seguimiento HTTP ${res.status} para ${code}.`, res.status, raw.slice(0, 500));
  }

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new CorreosError('Correos devolvió una respuesta no-JSON en el seguimiento.', res.status, raw.slice(0, 300));
  }

  const eventsRaw = Array.isArray(data.events) ? (data.events as Record<string, unknown>[]) : [];
  return {
    code: typeof data.code === 'string' ? data.code : code,
    product: typeof data.codProduct === 'string' ? data.codProduct : undefined,
    senderName: typeof data.remitName === 'string' ? data.remitName : undefined,
    addresseeName: typeof data.destiName === 'string' ? data.destiName : undefined,
    events: eventsRaw.map((e) => ({
      date: typeof e.eventDate === 'string' ? e.eventDate : undefined,
      code: typeof e.eventCode === 'string' ? e.eventCode : undefined,
      text: typeof e.summaryText === 'string' ? e.summaryText : undefined,
      location: typeof e.location === 'string' ? e.location : undefined,
    })),
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// DIAGNÓSTICO (sin crear ningún envío)
// ---------------------------------------------------------------------------

export interface CorreosDiagnostic {
  ok: boolean;
  steps: { name: string; ok: boolean; detail: string }[];
}

/**
 * Prueba escalonada de las credenciales SIN hacer un envío real:
 *   1) Pide un token a Correos ID  → valida CORREOS_CLIENT_ID/SECRET + activación.
 *   2) Llama al seguimiento con un código de sonda → valida las cabeceras del
 *      gateway. Un 401/403 = problema de credenciales del gateway; un 404 o un
 *      error de negocio = la AUTH pasó (el envío-sonda simplemente no existe).
 */
export async function diagnoseCorreos(): Promise<CorreosDiagnostic> {
  const steps: CorreosDiagnostic['steps'] = [];
  const c = getCorreosConfig();

  // Paso 1: token
  let tokenOk = false;
  try {
    const token = await getCorreosToken(true);
    const exp = jwtExpiry(token);
    const mins = exp ? Math.round((exp - Date.now() / 1000) / 60) : null;
    tokenOk = true;
    steps.push({
      name: 'Token Correos ID',
      ok: true,
      detail: `✅ Token obtenido${mins != null ? ` (caduca en ~${mins} min)` : ''}. Las credenciales de Correos ID son válidas y están activadas.`,
    });
  } catch (e) {
    const err = e instanceof CorreosError ? e : new CorreosError(String(e));
    steps.push({
      name: 'Token Correos ID',
      ok: false,
      detail:
        `❌ ${err.message}` +
        (err.status ? ` [HTTP ${err.status}]` : '') +
        (err.body ? `\n   Respuesta: ${err.body}` : '') +
        '\n   Pistas: si es 400/401 → client_id/secret mal o app aún NO activada por el gestor.',
    });
    return { ok: false, steps }; // sin token no seguimos
  }

  // Paso 2: sonda al gateway de seguimiento
  try {
    await trackShipment('PQ0000000000000000'); // código-sonda inexistente
    steps.push({
      name: 'Gateway seguimiento',
      ok: true,
      detail: '✅ El gateway aceptó la petición (auth OK). El envío-sonda no existe, pero eso es lo esperado.',
    });
  } catch (e) {
    const err = e instanceof CorreosError ? e : new CorreosError(String(e));
    if (err.status === 401 || err.status === 403) {
      steps.push({
        name: 'Gateway seguimiento',
        ok: false,
        detail:
          `❌ El gateway rechazó la auth [HTTP ${err.status}]. El token es válido pero el gateway pide otras credenciales client_id/client_secret.\n` +
          '   Solución: pedir a Correos el client_id/secret del gateway y ponerlos en CORREOS_GATEWAY_CLIENT_ID / _SECRET.' +
          (err.body ? `\n   Respuesta: ${err.body}` : ''),
      });
    } else {
      // 404 / error de negocio = la auth pasó; contamos el paso como OK.
      steps.push({
        name: 'Gateway seguimiento',
        ok: true,
        detail:
          `✅ El gateway respondió (auth OK). Código-sonda inexistente → HTTP ${err.status ?? '?'}, esperado.` +
          (err.body ? `\n   Respuesta: ${err.body}` : ''),
      });
    }
  }

  // Datos del contrato (informativo, no bloquea el seguimiento)
  steps.push({
    name: 'Datos de contrato',
    ok: isCorreosContractReady(),
    detail: isCorreosContractReady()
      ? `✅ contrato ${c.contractNumber} · cliente ${c.clientNumber} · etiquetador ${c.labellerCode} (listos para prerregistrar/etiquetar).`
      : '⚠️ Faltan CORREOS_NUM_CONTRATO / CORREOS_NUM_CLIENTE / CORREOS_COD_ETIQUETADOR. No hacen falta para el seguimiento, sí para generar etiquetas.',
  });

  return { ok: steps.every((s) => s.ok || s.name === 'Datos de contrato'), steps };
}
