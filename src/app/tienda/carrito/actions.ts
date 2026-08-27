'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { crearPedidoNumerado } from '@/lib/numero-de-pedido';
import { getCustomerSession } from '@/lib/auth';
import { clearCart, readCart, removeCartItem, writeCart } from '@/lib/cart';
import { priceCart } from '@/lib/pricing';
import { getSetting, getSettings, parseRecipients, SETTING_KEYS } from '@/lib/settings';
import { emailLayout, sendEmail } from '@/lib/email';
import { formatEuros } from '@/lib/utils';
import { decrementStockForOrder } from '@/lib/stock';

export async function removeItemAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (id) removeCartItem(id);
  revalidatePath('/tienda/carrito');
}

export async function updateQtyAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const qty = Math.max(1, Math.min(9999, Number(formData.get('quantity') ?? 1)));
  const cart = readCart();
  writeCart(cart.map((c) => (c.id === id ? { ...c, quantity: qty } : c)));
  revalidatePath('/tienda/carrito');
}

export async function clearCartAction() {
  clearCart();
  revalidatePath('/tienda/carrito');
}

const checkoutSchema = z.object({
  note: z.string().max(1000).optional(),
  confirm: z.literal('on', {
    errorMap: () => ({ message: 'Debe confirmar el pedido para continuar' }),
  }),
});

export interface CheckoutState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const session = await getCustomerSession();
  if (!session) redirect('/acceso');

  const cart = readCart();
  if (cart.length === 0) return { error: 'El carrito está vacío.' };

  const parsed = checkoutSchema.safeParse({
    note: String(formData.get('note') ?? ''),
    confirm: String(formData.get('confirm') ?? ''),
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe };
  }

  const { items, totals } = await priceCart(cart);
  if (!totals.meetsMinimum) {
    return {
      error: `El pedido mínimo es ${formatEuros(totals.minimumCents)}. Añada más unidades para continuar.`,
    };
  }

  const customer = session.customer;

  // Decrementa stock antes del email para que cualquier alerta llegue
  // como parte de la transacción del pedido.

  const order = await crearPedidoNumerado((numeroDePedido) => prisma.order.create({
    data: {
      number: numeroDePedido,
      customerId: customer.id,
      pharmacyName: customer.pharmacyName,
      cif: customer.cif,
      email: customer.email,
      contactName: customer.contactName,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      postalCode: customer.postalCode,
      province: customer.province,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      discountPct: totals.discountTier?.discountPct ?? null,
      shippingCents: totals.shippingCents,
      taxableBaseCents: totals.taxableBaseCents,
      vatPct: totals.vatPct,
      vatCents: totals.vatCents,
      equivSurchargePct: totals.equivSurchargeEnabled ? totals.equivSurchargePct : 0,
      equivSurchargeCents: totals.equivSurchargeCents,
      totalCents: totals.totalCents,
      customerNote: parsed.data.note || null,
      items: {
        create: items.map((it) => ({
          color: it.color,
          quantity: it.quantity,
          line1: it.line1,
          line2: it.line2,
          line3: it.line3 ?? '',
          unitPriceCents: it.unitPriceCents,
          lineTotalCents: it.lineTotalCents,
        })),
      },
    },
    include: { items: true },
  }));

  // Decrementar stock + posible email de alerta al admin
  await decrementStockForOrder(
    order.id,
    order.items.map((it) => ({ color: it.color, quantity: it.quantity })),
  ).catch(() => null);

  const recipients = parseRecipients(await getSetting(SETTING_KEYS.ORDERS_RECIPIENT_EMAILS));
  const settings = await getSettings();
  const deliveryDays = settings[SETTING_KEYS.DELIVERY_DAYS];

  const itemsTable = order.items
    .map((it) => orderRowHtml(it))
    .join('');

  const discountRow = order.discountCents > 0
    ? `<tr><td style="padding:4px 0;color:#16a34a;">Descuento volumen${order.discountPct ? ` (${order.discountPct}%)` : ''}</td><td style="text-align:right;color:#16a34a;">−${formatEuros(order.discountCents)}</td></tr>`
    : '';
  const shippingRow = totals.shippingMode === 'separate'
    ? `<tr><td style="padding:4px 0;color:#637787;">Portes</td><td style="text-align:right;">${order.shippingCents === 0 ? 'Gratis' : formatEuros(order.shippingCents)}</td></tr>`
    : '';
  const equivRow = order.equivSurchargeCents > 0
    ? `<tr><td style="padding:4px 0;color:#637787;">Recargo equivalencia (${order.equivSurchargePct}%)</td><td style="text-align:right;">${formatEuros(order.equivSurchargeCents)}</td></tr>`
    : '';

  const totalsBlock = `
    <table style="margin-top:16px;width:100%;font-size:14px;">
      <tr><td style="padding:4px 0;color:#637787;">Subtotal (${totals.totalUnits} uds)</td><td style="text-align:right;">${formatEuros(order.subtotalCents)}</td></tr>
      ${discountRow}
      ${shippingRow}
      <tr><td style="padding:4px 0;color:#637787;border-top:1px solid #ebeef0;">Base imponible</td><td style="text-align:right;border-top:1px solid #ebeef0;">${formatEuros(order.taxableBaseCents)}</td></tr>
      <tr><td style="padding:4px 0;color:#637787;">IVA (${order.vatPct}%)</td><td style="text-align:right;">${formatEuros(order.vatCents)}</td></tr>
      ${equivRow}
      <tr><td style="padding:8px 0 0;font-weight:700;border-top:1px solid #ebeef0;">TOTAL</td><td style="text-align:right;padding-top:8px;font-weight:700;border-top:1px solid #ebeef0;">${formatEuros(order.totalCents)}</td></tr>
    </table>`;

  const customerBlock = `
    <h3 style="margin:24px 0 8px;font-size:14px;color:#14503b;text-transform:uppercase;letter-spacing:0.06em;">Datos de la farmacia</h3>
    <table style="width:100%;font-size:13px;">
      <tr><td style="color:#637787;width:140px;padding:2px 0;">Farmacia</td><td>${esc(customer.pharmacyName)}</td></tr>
      <tr><td style="color:#637787;padding:2px 0;">CIF/NIF</td><td>${esc(customer.cif)}</td></tr>
      <tr><td style="color:#637787;padding:2px 0;">Email</td><td>${esc(customer.email)}</td></tr>
      ${customer.contactName ? `<tr><td style="color:#637787;padding:2px 0;">Contacto</td><td>${esc(customer.contactName)}</td></tr>` : ''}
      ${customer.phone ? `<tr><td style="color:#637787;padding:2px 0;">Teléfono</td><td>${esc(customer.phone)}</td></tr>` : ''}
      ${customer.address ? `<tr><td style="color:#637787;padding:2px 0;">Dirección</td><td>${esc(customer.address)}${customer.city ? `, ${esc(customer.city)}` : ''}${customer.postalCode ? ` (${esc(customer.postalCode)})` : ''}${customer.province ? ` · ${esc(customer.province)}` : ''}</td></tr>` : ''}
    </table>`;

  const noteBlock = parsed.data.note
    ? `<div style="margin-top:16px;padding:12px;background:#f6f7f8;border-left:3px solid #2a9b6e;border-radius:6px;"><strong>Comentario de la farmacia:</strong><br/>${esc(parsed.data.note)}</div>`
    : '';

  // Emails del pedido. Best-effort: el pedido YA está guardado en BD, así
  // que si el SMTP falla NO debe romperse la confirmación al cliente (si no,
  // vería un error 500 y podría reintentar creando pedidos duplicados).
  try {
  // Email a Lomhifar
  await sendEmail({
    to: recipients,
    replyTo: customer.email,
    subject: `Pedido #${order.number} · ${customer.pharmacyName}`,
    html: emailLayout(`
      <h2 style="margin:0 0 4px;font-size:22px;color:#14503b;">Nuevo pedido #${order.number}</h2>
      <p style="margin:0 0 16px;color:#637787;font-size:13px;">Recibido a través de la plataforma B2B</p>
      <h3 style="margin:0 0 8px;font-size:14px;color:#14503b;text-transform:uppercase;letter-spacing:0.06em;">Pulseras</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f0faf5;">
            <th align="left" style="padding:8px;border:1px solid #b7e6cf;">Color</th>
            <th align="center" style="padding:8px;border:1px solid #b7e6cf;width:70px;">Uds</th>
            <th align="left" style="padding:8px;border:1px solid #b7e6cf;">Texto grabado</th>
            <th align="right" style="padding:8px;border:1px solid #b7e6cf;width:90px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsTable}</tbody>
      </table>
      ${totalsBlock}
      ${customerBlock}
      ${noteBlock}
      <p style="margin-top:24px;color:#637787;font-size:12px;">Plazo de entrega estimado: ${deliveryDays} días laborables.</p>
    `, { preheader: `Pedido #${order.number} de ${customer.pharmacyName} · ${formatEuros(order.totalCents)}` }),
  });

  // Copia al cliente
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  await sendEmail({
    to: customer.email,
    subject: `Confirmación de pedido #${order.number} · Lomhifar`,
    html: emailLayout(`
      <h2 style="margin:0 0 4px;font-size:22px;color:#921a5e;">Hemos recibido su pedido</h2>
      <p style="margin:0 0 16px;color:#54545f;font-size:14px;">Referencia <strong>#${order.number}</strong></p>
      <p style="margin:0 0 16px;line-height:1.6;">
        Gracias por su pedido. A continuación encontrará el detalle. Nuestro equipo lo
        procesará en las próximas horas hábiles. Plazo estimado de entrega: <strong>${deliveryDays} días laborables</strong>.
      </p>
      <h3 style="margin:0 0 8px;font-size:14px;color:#921a5e;text-transform:uppercase;letter-spacing:0.06em;">Pulseras solicitadas</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#fce7f4;">
            <th align="left" style="padding:8px;border:1px solid #f8a8d4;">Color</th>
            <th align="center" style="padding:8px;border:1px solid #f8a8d4;width:70px;">Uds</th>
            <th align="left" style="padding:8px;border:1px solid #f8a8d4;">Texto grabado</th>
            <th align="right" style="padding:8px;border:1px solid #f8a8d4;width:90px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsTable}</tbody>
      </table>
      ${totalsBlock}
      ${noteBlock}

      <div style="margin-top:32px;padding:20px;background:linear-gradient(135deg,#fdf2f9 0%,#fce7f4 100%);border:1px solid #fbcfe9;border-radius:10px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#921a5e;font-weight:600;margin-bottom:4px;">📢 Para su farmacia</div>
        <div style="font-size:16px;font-weight:700;color:#1a1a20;margin-bottom:4px;">Descargue el cartel promocional</div>
        <div style="font-size:13px;color:#54545f;margin-bottom:14px;line-height:1.5;">
          Comunique a sus clientes que ofrece pulseras de identificación sanitaria personalizadas Lomhifar. Cartel listo para imprimir en A4.
        </div>
        <a href="${appUrl}/api/cartel" style="display:inline-block;background:linear-gradient(135deg,#921a5e 0%,#d12686 100%);color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          ⬇ Descargar cartel (PDF)
        </a>
      </div>
    `, { preheader: `Pedido #${order.number} confirmado · Lomhifar` }),
  });
  } catch (err) {
    console.error('[carrito] Fallo al enviar los emails del pedido (el pedido SÍ se ha guardado correctamente):', err);
  }

  clearCart();
  revalidatePath('/tienda/carrito');
  redirect(`/tienda/pedidos/${order.id}?nuevo=1`);
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function orderRowHtml(it: {
  color: string;
  quantity: number;
  line1: string;
  line2: string;
  line3?: string;
  unitPriceCents: number;
  lineTotalCents: number;
}): string {
  const color = it.color === 'BLACK' ? 'Negra' : 'Roja';
  const engraving = [it.line1, it.line2, it.line3 ?? '']
    .filter((l): l is string => Boolean(l && l.trim().length > 0))
    .map((l) => esc(l))
    .join('<br/>');
  return `<tr>
    <td style="padding:8px;border:1px solid #ebeef0;">${color}</td>
    <td style="padding:8px;border:1px solid #ebeef0;text-align:center;">${it.quantity}</td>
    <td style="padding:8px;border:1px solid #ebeef0;font-family:monospace;line-height:1.5;">${engraving}</td>
    <td style="padding:8px;border:1px solid #ebeef0;text-align:right;">${formatEuros(it.lineTotalCents)}</td>
  </tr>`;
}
