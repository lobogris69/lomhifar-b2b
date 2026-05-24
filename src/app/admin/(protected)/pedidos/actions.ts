'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ORDER_STATUSES } from '@/lib/enums';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { emailLayout, sendEmail } from '@/lib/email';
import { ORDER_STATUS_LABEL } from '@/components/shop/OrderStatusBadge';

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
