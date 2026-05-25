import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Integración InPost / ShipX webhooks (España).
 *
 * Documentación oficial:
 * - https://developers.inpost-group.com/tracking-events  (códigos)
 * - https://developers.inpost-group.com/webhooks         (suscripción + firma)
 *
 * Para activar webhooks en producción:
 * 1. Contactar con tu Account Manager de InPost (todavía no hay self-service).
 * 2. Indicar URL del webhook: https://TU-DOMINIO/api/webhooks/inpost
 * 3. Elegir método de firma: HMAC con secreto compartido.
 * 4. Pegar el secreto en /admin/configuracion → "Trazabilidad InPost"
 *    → "Secreto de firma webhook".
 *
 * Los eventos llegan con cabeceras:
 *   x-inpost-api-version   (ej "2024-06-01")
 *   x-inpost-topic         (ej "Shipment.Tracking")
 *   x-inpost-event-id      (id único — usado para idempotencia)
 *   x-inpost-timestamp     (UTC ISO o epoch)
 *   x-inpost-signature     (HMAC-SHA256 base64 de `${timestamp}.${body}`)
 */

// ===========================================================================
// MAPEO DE EVENTOS InPost → estado interno + etiqueta humana + email cliente
// ===========================================================================

export type MappedOrderStatus =
  | 'RECEIVED'
  | 'IN_PREPARATION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface EventMapping {
  /** Etiqueta en español, mostrada al cliente en el timeline */
  label: string;
  /** Estado interno al que se pasa el pedido (opcional — si null, no se cambia) */
  status?: MappedOrderStatus;
  /** ¿Debemos notificar al cliente por email? */
  notify: boolean;
  /** Si notify=true, plantilla de email a usar */
  emailKind?: 'in_transit' | 'ready_locker' | 'out_for_delivery' | 'delivered' | 'incident' | 'returned';
  /** Categoría visual del evento (color del icono en timeline) */
  category: 'created' | 'pickup' | 'transit' | 'ready' | 'delivered' | 'incident' | 'returned';
}

/**
 * Mapeo basado en los códigos oficiales de InPost ShipX.
 * Si llega un código no listado se usa un fallback genérico.
 */
export const INPOST_EVENT_MAP: Record<string, EventMapping> = {
  // Creación / preparación
  'CRE.1001': { label: 'Envío creado en InPost', status: 'IN_PREPARATION', notify: false, category: 'created' },
  'FMD.1001': { label: 'Preparado para recogida por mensajero', status: 'IN_PREPARATION', notify: false, category: 'pickup' },
  'FMD.1002': { label: 'Recogido por mensajero · en camino', status: 'SHIPPED', notify: true, emailKind: 'in_transit', category: 'pickup' },
  'FMD.1003': { label: 'En tránsito (primera milla)', status: 'SHIPPED', notify: false, category: 'transit' },
  'FMD.1004': { label: 'Recogido en punto PUDO', status: 'SHIPPED', notify: false, category: 'pickup' },
  'FMD.1005': { label: 'Recogido en locker InPost (origen)', status: 'SHIPPED', notify: false, category: 'pickup' },

  // Tránsito intermedio
  'MMD.1001': { label: 'Recibido en centro logístico InPost', status: 'SHIPPED', notify: false, category: 'transit' },
  'MMD.1002': { label: 'Procesado en centro logístico', status: 'SHIPPED', notify: false, category: 'transit' },
  'MMD.1003': { label: 'Salida desde centro logístico', status: 'SHIPPED', notify: false, category: 'transit' },
  'MMD.1004': { label: 'En tránsito entre centros', status: 'SHIPPED', notify: false, category: 'transit' },

  // Última milla
  'LMD.1001': { label: 'En reparto hacia destino', status: 'SHIPPED', notify: true, emailKind: 'out_for_delivery', category: 'transit' },
  'LMD.1003': { label: 'Listo para recoger en el destino', status: 'SHIPPED', notify: true, emailKind: 'ready_locker', category: 'ready' },
  'LMD.1004': { label: 'Listo para recoger en punto PUDO', status: 'SHIPPED', notify: true, emailKind: 'ready_locker', category: 'ready' },
  'LMD.1005': { label: 'Listo en el locker InPost para recoger', status: 'SHIPPED', notify: true, emailKind: 'ready_locker', category: 'ready' },
  'LMD.1006': { label: 'Listo en punto de recogida', status: 'SHIPPED', notify: true, emailKind: 'ready_locker', category: 'ready' },
  'LMD.3002': { label: 'Reasignado a punto de recogida alternativo', status: 'SHIPPED', notify: true, emailKind: 'ready_locker', category: 'ready' },

  // Incidencias en última milla
  'LMD.9004': { label: 'Intento de entrega fallido — se reintentará', notify: true, emailKind: 'incident', category: 'incident' },
  'LMD.9005': { label: 'No entregable: dirección incorrecta', notify: true, emailKind: 'incident', category: 'incident' },
  'LMD.9006': { label: 'No entregable: rechazado por el destinatario', notify: true, emailKind: 'incident', category: 'incident' },
  'LMD.9007': { label: 'No entregable: dañado en tránsito', notify: true, emailKind: 'incident', category: 'incident' },
  'LMD.9008': { label: 'No entregable: ausente', notify: true, emailKind: 'incident', category: 'incident' },
  'LMD.9009': { label: 'No entregable: paquete perdido', notify: true, emailKind: 'incident', category: 'incident' },
  'LMD.9010': { label: 'No entregable: motivo no especificado', notify: true, emailKind: 'incident', category: 'incident' },
  'LMD.9011': { label: 'No entregable: otra razón', notify: true, emailKind: 'incident', category: 'incident' },
  'LMD.9029': { label: 'Intento fallido — destinatario menor de edad', notify: true, emailKind: 'incident', category: 'incident' },

  // Entregado
  'EOL.1001': { label: 'Entregado', status: 'DELIVERED', notify: true, emailKind: 'delivered', category: 'delivered' },
  'EOL.1002': { label: '¡Recogido por el cliente en el locker!', status: 'DELIVERED', notify: true, emailKind: 'delivered', category: 'delivered' },
  'EOL.1003': { label: 'Entregado en lugar seguro', status: 'DELIVERED', notify: true, emailKind: 'delivered', category: 'delivered' },
  'EOL.1004': { label: 'Entregado al vecino', status: 'DELIVERED', notify: true, emailKind: 'delivered', category: 'delivered' },
  'EOL.1005': { label: 'Entregado con verificación de identidad', status: 'DELIVERED', notify: true, emailKind: 'delivered', category: 'delivered' },
  'EOL.1006': { label: 'Entregado en dirección alternativa', status: 'DELIVERED', notify: true, emailKind: 'delivered', category: 'delivered' },
  'EOL.1007': { label: 'Entregado a tercera persona', status: 'DELIVERED', notify: true, emailKind: 'delivered', category: 'delivered' },
  'EOL.1008': { label: 'Entregado en buzón', status: 'DELIVERED', notify: true, emailKind: 'delivered', category: 'delivered' },

  // Final por incidencia
  'EOL.9001': { label: 'Envío extraviado por el carrier', notify: true, emailKind: 'incident', category: 'incident' },
  'EOL.9002': { label: 'Envío dañado', notify: true, emailKind: 'incident', category: 'incident' },
  'EOL.9003': { label: 'Envío destruido', notify: true, emailKind: 'incident', category: 'incident' },
  'EOL.9004': { label: 'Envío cancelado', status: 'CANCELLED', notify: true, emailKind: 'incident', category: 'incident' },
  'EOL.9005': { label: 'Tiempo de recogida en locker expirado — se devuelve', notify: true, emailKind: 'incident', category: 'incident' },
  'EOL.9006': { label: 'Envío finalizado con incidencia', notify: true, emailKind: 'incident', category: 'incident' },

  // Devoluciones
  'RTS.1001': { label: 'Iniciada devolución al remitente', notify: false, category: 'returned' },
  'RTS.1002': { label: 'Devolución completada', notify: false, category: 'returned' },
};

/** Devuelve mapeo, con fallback genérico si el código es desconocido. */
export function mapInpostEvent(code: string): EventMapping {
  return (
    INPOST_EVENT_MAP[code] ?? {
      label: `Actualización de tracking (${code})`,
      notify: false,
      category: 'transit',
    }
  );
}

// ===========================================================================
// VALIDACIÓN DE FIRMA HMAC
// ===========================================================================

export interface VerifySignatureOptions {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
  /** Si true, firma sobre `${timestamp}.${body}`. Si false, solo body. */
  includeTimestamp?: boolean;
  /** Tolerancia máxima en segundos entre el timestamp y "ahora" (anti replay) */
  maxAgeSeconds?: number;
}

/**
 * Valida la firma HMAC-SHA256 del webhook de InPost.
 * Devuelve { ok: true } si la firma es válida, o { ok: false, reason } si no.
 */
export function verifyInpostSignature(opts: VerifySignatureOptions): { ok: true } | { ok: false; reason: string } {
  if (!opts.signatureHeader) return { ok: false, reason: 'Missing x-inpost-signature header' };
  if (!opts.secret) return { ok: false, reason: 'No webhook secret configured' };

  const includeTimestamp = opts.includeTimestamp ?? true;
  const maxAge = opts.maxAgeSeconds ?? 60 * 5; // 5 minutos default

  if (includeTimestamp && !opts.timestampHeader) {
    return { ok: false, reason: 'Missing x-inpost-timestamp header' };
  }

  // Anti replay: rechaza eventos muy antiguos
  if (opts.timestampHeader) {
    const ts = parseTimestamp(opts.timestampHeader);
    if (ts !== null) {
      const ageSec = Math.abs(Date.now() / 1000 - ts.getTime() / 1000);
      if (ageSec > maxAge) {
        return { ok: false, reason: `Timestamp too old (${Math.round(ageSec)}s > ${maxAge}s)` };
      }
    }
  }

  const message = includeTimestamp
    ? `${opts.timestampHeader}.${opts.rawBody}`
    : opts.rawBody;

  const expected = createHmac('sha256', opts.secret).update(message, 'utf8').digest('base64');

  // Comparación constante en tiempo para evitar timing attacks
  try {
    const expectedBuf = Buffer.from(expected, 'utf8');
    const providedBuf = Buffer.from(opts.signatureHeader, 'utf8');
    if (expectedBuf.length !== providedBuf.length) {
      return { ok: false, reason: 'Signature length mismatch' };
    }
    if (!timingSafeEqual(expectedBuf, providedBuf)) {
      return { ok: false, reason: 'Signature mismatch' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'Signature compare error' };
  }
}

function parseTimestamp(raw: string): Date | null {
  // Acepta epoch (segundos o ms) o ISO 8601
  const num = Number(raw);
  if (Number.isFinite(num) && num > 0) {
    return new Date(num < 1e12 ? num * 1000 : num);
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ===========================================================================
// PAYLOAD ESPERADO
// ===========================================================================

export interface InpostWebhookPayload {
  /** Identificador único del evento (también viene en x-inpost-event-id) */
  event_id?: string;
  /** Código del evento (LMD.1005, EOL.1002, etc.) */
  event_code?: string;
  /** Nº de tracking del envío (lo usamos para identificar el pedido) */
  tracking_number?: string;
  /** Cuándo ocurrió el evento en la red del carrier (UTC) */
  occurred_at?: string;
  /** Detalle libre del evento (descripción, locker_id, etc.) */
  details?: Record<string, unknown>;
  /** Permitir campos extra sin romper */
  [key: string]: unknown;
}

export function normalizePayload(body: unknown): InpostWebhookPayload {
  if (!body || typeof body !== 'object') return {};
  const b = body as Record<string, unknown>;

  // InPost envía variantes (camelCase / snake_case). Normalizamos.
  return {
    event_id: pickString(b, ['event_id', 'eventId', 'id']),
    event_code: pickString(b, ['event_code', 'eventCode', 'code', 'type']),
    tracking_number: pickString(b, ['tracking_number', 'trackingNumber', 'tracking', 'shipment_number']),
    occurred_at: pickString(b, ['occurred_at', 'occurredAt', 'timestamp', 'event_time']),
    details: typeof b.details === 'object' ? (b.details as Record<string, unknown>) : undefined,
    ...b,
  };
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}
