'use server';

import { revalidatePath } from 'next/cache';
import { ORDER_STATUSES } from '@/lib/enums';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { emailLayout, sendEmail } from '@/lib/email';
import { ORDER_STATUS_LABEL } from '@/components/shop/OrderStatusBadge';
import { buildTrackingUrl, getCarrierLabel } from '@/lib/shipping';
import { restoreStockForOrder } from '@/lib/stock';
import {
  createShipment as mrCreateShipment,
  buildPublicTrackingUrl as mrTrackingUrl,
  isMondialRelayEnabled,
} from '@/lib/mondial-relay';

async function ensureAdmin() {
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  await requireAdmin({ write: true });
}

export async function updateOrderStatus(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const notify = formData.get('notify') === 'on';

  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return;

  // Necesitamos el estado ANTERIOR y las líneas para poder devolver el stock
  // si es una cancelación (update() solo devuelve el estado ya nuevo).
  const before = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!before) return;

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  // Al CANCELAR por primera vez un pedido REAL, devolver sus unidades al
  // stock (los de prueba nunca lo descontaron). Sin esto el stock contable
  // quedaba por debajo del físico y disparaba falsas alertas de "stock bajo".
  if (status === 'CANCELLED' && before.status !== 'CANCELLED' && !before.isTest) {
    await restoreStockForOrder(
      before.id,
      before.items.map((it) => ({ color: it.color, quantity: it.quantity })),
    ).catch(() => null);
  }

  if (notify) {
    try {
    await sendEmail({
      to: order.email,
      subject: `Pedido #${order.number} · ${ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL]} · Lomhifar`,
      html: emailLayout(`
        <h2 style="margin:0 0 12px;color:#14503b;">Actualización de su pedido #${order.number}</h2>
        <p>El estado de su pedido ha cambiado a:</p>
        <p style="margin:16px 0;text-align:center;">
          <span style="display:inline-block;padding:10px 20px;border-radius:999px;background:#f0faf5;color:#14503b;font-weight:600;border:1px solid #b7e6cf;">${ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL]}</span>
        </p>
        <p style="color:#637787;font-size:13px;">Puede consultar el detalle en su área privada.</p>
      `),
    });
    } catch (err) {
      console.error('[pedidos] Fallo al enviar email de cambio de estado (el estado SÍ se ha guardado):', err);
    }
  }

  revalidatePath('/admin/pedidos');
  revalidatePath(`/admin/pedidos/${id}`);
}

/**
 * Marca el pedido como GRABADO (láser hecho). Rellena engravedAt y, si el
 * pedido aún estaba en RECIBIDO o EN ESPERA, lo pasa a EN PREPARACIÓN.
 * No envía email al cliente (es un paso interno de producción).
 * Parte del flujo guiado: tras grabar, el siguiente paso es el envío.
 */
export async function markAsEngraved(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return;

  const newStatus =
    order.status === 'RECEIVED' || order.status === 'ON_HOLD'
      ? 'IN_PREPARATION'
      : order.status;

  await prisma.order.update({
    where: { id },
    data: {
      engravedAt: order.engravedAt ?? new Date(),
      status: newStatus,
    },
  });

  revalidatePath('/admin/pedidos');
  revalidatePath(`/admin/pedidos/${id}`);
}

/**
 * Deshace el marcado de grabado (por si se pulsó por error). Solo limpia
 * engravedAt; NO revierte el estado automáticamente (el admin lo ajusta a
 * mano si quiere) para no crear efectos sorpresa.
 */
export async function unmarkEngraved(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  await prisma.order.update({ where: { id }, data: { engravedAt: null } });
  revalidatePath(`/admin/pedidos/${id}`);
}

export async function saveAdminNotes(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const notes = String(formData.get('adminNotes') ?? '');
  await prisma.order.update({ where: { id }, data: { adminNotes: notes || null } });
  revalidatePath(`/admin/pedidos/${id}`);
}

/**
 * Asigna nº de tracking + transportista a un pedido. Si está en estado
 * RECEIVED o IN_PREPARATION, lo pasa automáticamente a SHIPPED.
 * Envía email al cliente con el link de seguimiento.
 */
export async function saveTracking(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const carrier = String(formData.get('carrier') ?? 'inpost');
  const trackingNumber = String(formData.get('trackingNumber') ?? '').trim();
  const customUrl = String(formData.get('customUrl') ?? '').trim();
  const notify = formData.get('notify') === 'on';

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return;

  // Construir URL de tracking
  let trackingUrl: string | null = null;
  if (carrier === 'other') {
    trackingUrl = customUrl || null;
  } else if (trackingNumber) {
    trackingUrl = buildTrackingUrl(carrier, trackingNumber);
  }

  const newStatus = (order.status === 'RECEIVED' || order.status === 'IN_PREPARATION' || order.status === 'ON_HOLD')
    ? 'SHIPPED'
    : order.status;

  const updated = await prisma.order.update({
    where: { id },
    data: {
      trackingNumber: trackingNumber || null,
      trackingUrl,
      status: newStatus,
      shippedAt: newStatus === 'SHIPPED' && !order.shippedAt ? new Date() : order.shippedAt,
    },
  });

  // Email al cliente con tracking
  if (notify && trackingNumber) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const carrierLabel = getCarrierLabel(carrier);
    try {
    await sendEmail({
      to: updated.email,
      subject: `Su pedido #${updated.number} está en camino · Lomhifar`,
      html: emailLayout(`
        <h2 style="margin:0 0 12px;color:#921a5e;">🚚 Su pedido está en camino</h2>
        <p style="font-size:15px;margin:0 0 16px;">
          Hemos enviado su pedido <strong>#${updated.number}</strong> mediante <strong>${carrierLabel}</strong>.
        </p>
        <div style="background:#fdf2f9;border:1px solid #fbcfe9;border-radius:10px;padding:18px;margin:18px 0;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#921a5e;font-weight:600;">Nº de seguimiento</div>
          <div style="font-size:20px;font-weight:700;color:#1a1a20;font-family:monospace;margin-top:4px;letter-spacing:2px;">${trackingNumber}</div>
          ${trackingUrl ? `
            <p style="margin:14px 0 0;">
              <a href="${trackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#921a5e 0%,#d12686 100%);color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                Seguir mi envío
              </a>
            </p>
          ` : ''}
        </div>
        <p style="color:#54545f;font-size:13px;">
          También puede consultar el detalle completo en su panel:
          <a href="${appUrl}/tienda/pedidos/${updated.id}" style="color:#921a5e;">Ver pedido</a>
        </p>
      `, { preheader: `Pedido #${updated.number} enviado · seguimiento ${trackingNumber}` }),
    });
    } catch (err) {
      console.error('[pedidos] Fallo al enviar email de seguimiento (el tracking SÍ se ha guardado):', err);
    }
  }

  revalidatePath('/admin/pedidos');
  revalidatePath(`/admin/pedidos/${id}`);
}

// ===========================================================================
// MONDIAL RELAY — generación automática de etiqueta
// ===========================================================================

export interface CreateMrLabelState {
  ok?: boolean;
  error?: string;
  trackingNumber?: string;
  labelUrl?: string;
}

/**
 * Crea automáticamente una expedición en Mondial Relay para el pedido dado,
 * guarda el nº de tracking en la BD y deja la URL del PDF de la etiqueta
 * para que el admin la imprima. Marca el pedido como SHIPPED.
 */
export async function createMondialRelayLabel(
  _prev: CreateMrLabelState,
  formData: FormData,
): Promise<CreateMrLabelState> {
  await ensureAdmin();

  const id = String(formData.get('orderId') ?? '');
  const relayId = String(formData.get('relayId') ?? '').trim() || undefined;

  if (!(await isMondialRelayEnabled())) {
    return {
      error: 'Mondial Relay no está activo. Configura credenciales y activa el toggle en /admin/configuracion.',
    };
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: 'Pedido no encontrado' };

  if (!order.email || !order.phone || !order.address || !order.city || !order.postalCode) {
    return {
      error: 'Faltan datos del destinatario (email, teléfono, dirección, ciudad o CP). Completa la ficha del cliente antes de generar la etiqueta.',
    };
  }

  const result = await mrCreateShipment({
    destName: order.pharmacyName,
    destStreet: order.address,
    destCity: order.city,
    destCP: order.postalCode,
    destCountry: 'ES',
    destPhone: order.phone,
    destEmail: order.email,
    relayId,
    relayCountry: relayId ? 'ES' : undefined,
    reference: `LH-${order.number}`,
  });

  if (!result.ok || !result.trackingNumber) {
    return { error: result.errorMessage ?? 'Error desconocido al crear la etiqueta' };
  }

  // Guardar tracking + URL + marcar como SHIPPED si no lo estaba
  const newStatus =
    order.status === 'RECEIVED' || order.status === 'IN_PREPARATION' || order.status === 'ON_HOLD'
      ? 'SHIPPED'
      : order.status;

  await prisma.order.update({
    where: { id },
    data: {
      trackingNumber: result.trackingNumber,
      trackingUrl: mrTrackingUrl(result.trackingNumber),
      status: newStatus,
      shippedAt: newStatus === 'SHIPPED' && !order.shippedAt ? new Date() : order.shippedAt,
    },
  });

  revalidatePath('/admin/pedidos');
  revalidatePath(`/admin/pedidos/${id}`);

  return {
    ok: true,
    trackingNumber: result.trackingNumber,
    labelUrl: result.labelUrl,
  };
}
