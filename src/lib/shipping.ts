/**
 * Helpers de envío y tracking.
 * Por defecto se trabaja con InPost España (track.inpost.es).
 * Si en un futuro se integra la API real de InPost, esta capa se ampliará
 * para crear el envío automáticamente al pasar a SHIPPED.
 */

export const DEFAULT_CARRIER = 'inpost';

export interface CarrierInfo {
  key: string;
  label: string;
  /** Plantilla de URL pública de tracking. {number} se sustituye por el nº */
  trackingUrlTemplate: string;
  helperText: string;
}

export const CARRIERS: CarrierInfo[] = [
  {
    key: 'inpost',
    label: 'InPost',
    trackingUrlTemplate: 'https://inpost.es/track/{number}',
    helperText: 'Empresa de envíos por defecto. El cliente verá el link directo al tracking.',
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
    key: 'correos',
    label: 'Correos',
    trackingUrlTemplate: 'https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number={number}',
    helperText: '',
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
