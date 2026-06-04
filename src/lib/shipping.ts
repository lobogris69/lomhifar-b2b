/**
 * Helpers de envío y tracking.
 *
 * Transportista por defecto: Correos España (Paq Estándar). El admin
 * imprime la etiqueta desde el portal de Correos Empresas, pega aquí el
 * nº de seguimiento y el sistema construye automáticamente el link
 * público del localizador de Correos, que es idéntico para Paq Premium
 * y Paq Estándar (el cliente lo abre desde el email).
 *
 * Si en un futuro se integra la API REST oficial de Correos, esta capa
 * se ampliará para crear el envío automáticamente al pasar a SHIPPED.
 */

export const DEFAULT_CARRIER = 'correos-standard';

export interface CarrierInfo {
  key: string;
  label: string;
  /** Plantilla de URL pública de tracking. {number} se sustituye por el nº */
  trackingUrlTemplate: string;
  helperText: string;
}

// URL pública del localizador de Correos. Sirve para Paq Estándar y Paq
// Premium (ambos servicios comparten sistema de tracking).
const CORREOS_TRACKING_URL =
  'https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number={number}';

export const CARRIERS: CarrierInfo[] = [
  {
    key: 'correos-standard',
    label: 'Correos · Paq Estándar',
    trackingUrlTemplate: CORREOS_TRACKING_URL,
    helperText: 'Entrega en 48-72h laborables. El cliente recibirá link al localizador de Correos.',
  },
  {
    key: 'correos-premium',
    label: 'Correos · Paq Premium',
    trackingUrlTemplate: CORREOS_TRACKING_URL,
    helperText: 'Entrega en 24-48h laborables, prioritario. El cliente recibirá link al localizador de Correos.',
  },
  {
    key: 'seur',
    label: 'SEUR',
    trackingUrlTemplate: 'https://www.seur.com/es/particulares/herramientas/livetracking?segOnlineIdentifier={number}',
    helperText: 'Alternativa: introduce el código que te dé SEUR.',
  },
  {
    key: 'mrw',
    label: 'MRW',
    trackingUrlTemplate: 'https://www.mrw.es/seguimiento_envios/MRW_seguimiento_online.asp?numero_envio={number}',
    helperText: '',
  },
  {
    key: 'inpost',
    label: 'InPost',
    trackingUrlTemplate: 'https://inpost.es/track/{number}',
    helperText: 'Alternativa: solo si el envío fue a un Punto Locker InPost.',
  },
  {
    key: 'other',
    label: 'Otro / URL manual',
    trackingUrlTemplate: '',
    helperText: 'Pega la URL completa de seguimiento.',
  },
];

/**
 * Construye la URL de tracking dado un transportista y un número.
 * Si no hay plantilla, devuelve solo el número.
 */
export function buildTrackingUrl(carrierKey: string, trackingNumber: string): string {
  const carrier = CARRIERS.find((c) => c.key === carrierKey);
  if (!carrier || !carrier.trackingUrlTemplate) return trackingNumber;
  return carrier.trackingUrlTemplate.replace('{number}', encodeURIComponent(trackingNumber.trim()));
}

/**
 * Devuelve el label legible de un carrier. Usado en emails al cliente para
 * que vea por ejemplo 'Correos · Paq Premium' en lugar del key interno.
 * Para carriers desconocidos guardados en BD antes de un cambio (p.ej.
 * 'inpost' o el viejo 'correos'), devuelve un label razonable de fallback.
 */
export function getCarrierLabel(carrierKey: string): string {
  const carrier = CARRIERS.find((c) => c.key === carrierKey);
  if (carrier) return carrier.label;
  // Fallbacks suaves para carriers antiguos guardados antes de los cambios.
  if (carrierKey === 'correos') return 'Correos';
  if (carrierKey === 'inpost') return 'InPost';
  return carrierKey.toUpperCase();
}
