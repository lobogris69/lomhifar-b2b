'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ORDER_STATUSES } from '@/lib/enums';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { emailLayout, sendEmail } from '@/lib/email';
import { ORDER_STATUS_LABEL } from '@/components/shop/OrderStatusBadge';
import { buildTrackingUrl } from '@/lib/shipping';

async function ensureAdmin() {
  const s = await getAdminSession();
  if (!s) redirect('/admin/login');
}

export async function updateOrderStatus(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const notify = formData.get('notify') === 'on';

  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return;

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  if (notify) {
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
  }

  revalidatePath('/admin/pedidos');
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
    const carrierLabel = carrier === 'inpost' ? 'InPost' : carrier.toUpperCase();
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
  }

  revalidatePath('/admin/pedidos');
  revalidatePath(`/admin/pedidos/${id}`);
}
