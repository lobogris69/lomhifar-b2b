import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSetting, SETTING_KEYS } from '@/lib/settings';
import {
  mapInpostEvent,
  normalizePayload,
  verifyInpostSignature,
} from '@/lib/inpost';
import { sendTrackingEmail } from '@/lib/inpost-emails';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint público de InPost para webhooks de tracking.
 *
 * URL a comunicar a InPost: https://TU-DOMINIO/api/webhooks/inpost
 *
 * Acepta peticiones POST firmadas con HMAC-SHA256 sobre `${timestamp}.${body}`,
 * comparado contra el secreto guardado en settings (SHIPPING_INPOST_WEBHOOK_SECRET).
 *
 * Responde:
 *  - 200 OK  → procesado correctamente o ignorado por idempotencia
 *  - 401     → firma inválida o secreto no configurado
 *  - 400     → payload no parseable o sin tracking number
 *  - 404     → no encontramos pedido con ese tracking number
 */
export async function POST(req: NextRequest) {
  // 1) Leemos el cuerpo crudo PARA la firma (no podemos usar req.json() porque
  //    re-serializaría con espacios distintos).
  const rawBody = await req.text();

  // 2) Recuperamos el secreto y el modo de firma del admin
  const secret = await getSetting(SETTING_KEYS.SHIPPING_INPOST_WEBHOOK_SECRET).catch(() => '');
  const signatureMode = await getSetting(SETTING_KEYS.SHIPPING_INPOST_SIGNATURE_MODE).catch(() => 'timestamp_body');

  // 3) Validar firma (a menos que sea entorno de desarrollo sin secreto configurado)
  const skipSignature = process.env.NODE_ENV !== 'production' && !secret;
  if (!skipSignature) {
    const verify = verifyInpostSignature({
      rawBody,
      signatureHeader: req.headers.get('x-inpost-signature'),
      timestampHeader: req.headers.get('x-inpost-timestamp'),
      secret,
      includeTimestamp: signatureMode !== 'body_only',
    });
    if (!verify.ok) {
      console.warn('[inpost webhook] signature invalid:', verify.reason);
      return NextResponse.json({ error: 'invalid signature', reason: verify.reason }, { status: 401 });
    }
  }

  // 4) Parsear payload
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const payload = normalizePayload(parsed);
  const externalEventId =
    payload.event_id ?? req.headers.get('x-inpost-event-id') ?? undefined;
  const eventCode = payload.event_code ?? 'UNKNOWN';
  const trackingNumber = payload.tracking_number;

  if (!trackingNumber) {
    return NextResponse.json({ error: 'tracking_number missing' }, { status: 400 });
  }

  // 5) Idempotencia: si ya tenemos ese event_id procesado, devolvemos 200
  if (externalEventId) {
    const existing = await prisma.trackingEvent.findUnique({
      where: { externalEventId },
    });
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }
  }

  // 6) Buscar pedido por trackingNumber
  const order = await prisma.order.findFirst({
    where: { trackingNumber },
    select: {
      id: true, number: true, email: true, pharmacyName: true,
      trackingNumber: true, trackingUrl: true, status: true, shippedAt: true,
      deliveredAt: true,
    },
  });

  if (!order) {
    // Aún así guardamos el evento como huérfano para auditoría futura.
    console.warn(`[inpost webhook] order not found for tracking ${trackingNumber}`);
    return NextResponse.json({ error: 'order not found' }, { status: 404 });
  }

  // 7) Mapeo del evento + cuándo ocurrió
  const mapping = mapInpostEvent(eventCode);
  const eventAt = payload.occurred_at
    ? new Date(payload.occurred_at)
    : (() => {
        const ts = req.headers.get('x-inpost-timestamp');
        if (ts) {
          const n = Number(ts);
          if (Number.isFinite(n)) return new Date(n < 1e12 ? n * 1000 : n);
          const d = new Date(ts);
          if (!Number.isNaN(d.getTime())) return d;
        }
        return new Date();
      })();

  // 8) Decidir si notificar al cliente (respetar toggle global)
  const notifyEnabled = (await getSetting(SETTING_KEYS.SHIPPING_NOTIFY_CUSTOMER).catch(() => 'true')) === 'true';
  const shouldNotify = notifyEnabled && mapping.notify;

  // 9) Persistir TrackingEvent + actualizar campos de Order en una transacción
  const lockerInfo = extractLockerInfo(payload);
  const reason = extractReason(payload);

  await prisma.$transaction(async (tx) => {
    await tx.trackingEvent.create({
      data: {
        orderId: order.id,
        carrier: 'inpost',
        externalEventId,
        eventCode,
        eventLabel: mapping.label,
        mappedStatus: mapping.status ?? null,
        eventAt,
        payloadJson: JSON.stringify(payload),
        customerNotified: false, // lo actualizamos abajo si se envía email
      },
    });

    const dataPatch: Record<string, unknown> = {
      lastTrackingCode: eventCode,
      lastTrackingLabel: mapping.label,
      lastTrackingAt: eventAt,
    };
    if (mapping.status && mapping.status !== order.status) {
      dataPatch.status = mapping.status;
    }
    if (mapping.status === 'SHIPPED' && !order.shippedAt) {
      dataPatch.shippedAt = eventAt;
    }
    if (mapping.status === 'DELIVERED' && !order.deliveredAt) {
      dataPatch.deliveredAt = eventAt;
    }

    await tx.order.update({ where: { id: order.id }, data: dataPatch });
  });

  // 10) Email al cliente (fuera de la transacción)
  if (shouldNotify) {
    const sent = await sendTrackingEmail(order, mapping, { lockerInfo, reason });
    if (sent) {
      await prisma.trackingEvent
        .updateMany({
          where: { orderId: order.id, externalEventId },
          data: { customerNotified: true },
        })
        .catch(() => null);
    }
  }

  return NextResponse.json(
    { ok: true, orderId: order.id, eventCode, notified: shouldNotify },
    { status: 200 },
  );
}

/** Extrae info de locker del payload (best-effort sobre estructuras conocidas). */
function extractLockerInfo(p: unknown): string | undefined {
  if (!p || typeof p !== 'object') return undefined;
  const d = (p as Record<string, unknown>).details ?? p;
  if (typeof d !== 'object' || !d) return undefined;
  const o = d as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof o.locker_id === 'string') parts.push(`Locker ${o.locker_id}`);
  if (typeof o.locker_name === 'string') parts.push(String(o.locker_name));
  if (typeof o.address === 'string') parts.push(String(o.address));
  if (typeof o.city === 'string') parts.push(String(o.city));
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function extractReason(p: unknown): string | undefined {
  if (!p || typeof p !== 'object') return undefined;
  const d = (p as Record<string, unknown>).details ?? p;
  if (typeof d !== 'object' || !d) return undefined;
  const o = d as Record<string, unknown>;
  if (typeof o.reason === 'string') return o.reason;
  if (typeof o.description === 'string') return o.description;
  return undefined;
}

/**
 * GET para "ping" — útil para que el equipo de InPost compruebe que la URL
 * responde antes de configurar el webhook real.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'lomhifar-inpost-webhook',
    docs: 'https://developers.inpost-group.com/webhooks',
  });
}
