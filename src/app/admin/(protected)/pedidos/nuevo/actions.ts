'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { crearPedidoNumerado } from '@/lib/numero-de-pedido';
import { asegurarClienteMostrador, notaDeTalonario } from '@/lib/mostrador';
// Los canales viven fuera: un fichero 'use server' sólo puede exportar
// funciones asíncronas, y exportar de aquí una constante tumba la página.
import { CHANNEL_VALUES, CHANNEL_LABEL } from './channels';
import { requireAdmin } from '@/lib/auth';
import { priceCart } from '@/lib/pricing';
import { getSetting, getSettings, parseRecipients, SETTING_KEYS } from '@/lib/settings';
import { emailLayout, sendEmail } from '@/lib/email';
import { formatEuros, normalizeCif, normalizeEmail } from '@/lib/utils';
import { isValidSpanishTaxId } from '@/lib/validations';
import { decrementStockForOrder } from '@/lib/stock';

export interface QuickCustomerState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  customerId?: string;
}

/**
 * Alta rápida de cliente desde el formulario de pedido manual.
 * Datos mínimos obligatorios. El admin puede completar el resto más
 * tarde desde /admin/clientes.
 */
export async function quickCreateCustomer(
  _prev: QuickCustomerState,
  formData: FormData,
): Promise<QuickCustomerState> {
  await requireAdmin({ write: true });

  const cif = normalizeCif(String(formData.get('cif') ?? ''));
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const pharmacyName = String(formData.get('pharmacyName') ?? '').trim();
  const contactName = String(formData.get('contactName') ?? '').trim() || null;
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const address = String(formData.get('address') ?? '').trim() || null;
  const city = String(formData.get('city') ?? '').trim() || null;
  const postalCode = String(formData.get('postalCode') ?? '').trim() || null;
  const province = String(formData.get('province') ?? '').trim() || null;

  const fe: Record<string, string> = {};
  if (!isValidSpanishTaxId(cif)) fe.cif = 'CIF/NIF/NIE no válido';
  if (!email.includes('@')) fe.email = 'Email no válido';
  if (pharmacyName.length < 2) fe.pharmacyName = 'Nombre obligatorio';
  if (Object.keys(fe).length) return { fieldErrors: fe };

  const existing = await prisma.customer.findUnique({ where: { cif } });
  if (existing) {
    return { ok: true, customerId: existing.id };
  }

  const created = await prisma.customer.create({
    data: {
      cif, email, pharmacyName, contactName, phone,
      address, city, postalCode, province,
      active: true,
      source: 'MANUAL',
    },
  });
  revalidatePath('/admin/clientes');
  return { ok: true, customerId: created.id };
}

// ============================================================
// Crear pedido manual
// ============================================================


const itemSchema = z.object({
  color: z.enum(['BLACK', 'RED']),
  quantity: z.coerce.number().int().min(1).max(9999),
  line1: z.string().min(1, 'Línea 1 obligatoria').max(40),
  line2: z.string().max(40).optional().default(''),
  line3: z.string().max(40).optional().default(''),
});

const createOrderSchema = z.object({
  // Opcional a propósito: en modo talonario no se elige cliente, se usa el
  // genérico de mostrador. La comprobación va más abajo, según el modo.
  customerId: z.string().optional().default(''),
  talonario: z.string().optional(),          // 'on' | undefined
  talonarioFarmacia: z.string().max(120).optional().default(''),
  talonarioRef: z.string().max(40).optional().default(''),
  channel: z.enum(CHANNEL_VALUES),
  notify: z.string().optional(), // 'on' | undefined
  isTest: z.string().optional(), // 'on' | undefined
  adminNote: z.string().max(500).optional().default(''),
  itemsJson: z.string().min(2, 'Añade al menos una pulsera'),
});

export interface CreateManualOrderState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  orderId?: string;
  orderNumber?: number;
}

/**
 * Crea un pedido en nombre de un cliente registrado, tal como si el
 * cliente lo hubiese hecho desde la web. Se marca con source='ADMIN'
 * y el canal (PHONE, VISIT, etc.) para estadísticas.
 *
 * Si 'notify' está marcado, envía email de confirmación al cliente.
 * En cualquier caso envía email interno a la cuenta de Lomhifar (para
 * la trazabilidad habitual).
 */
export async function createManualOrder(
  _prev: CreateManualOrderState,
  formData: FormData,
): Promise<CreateManualOrderState> {
  const session = await requireAdmin({ write: true });

  const parsed = createOrderSchema.safeParse({
    customerId: String(formData.get('customerId') ?? ''),
    talonario: formData.get('talonario') ? 'on' : undefined,
    talonarioFarmacia: String(formData.get('talonarioFarmacia') ?? ''),
    talonarioRef: String(formData.get('talonarioRef') ?? ''),
    channel: String(formData.get('channel') ?? ''),
    notify: formData.get('notify') ? 'on' : undefined,
    isTest: formData.get('isTest') ? 'on' : undefined,
    adminNote: String(formData.get('adminNote') ?? ''),
    itemsJson: String(formData.get('itemsJson') ?? '[]'),
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe };
  }

  const isTest = parsed.data.isTest === 'on';

  const esTalonario = parsed.data.talonario === 'on';
  const nombreFarmacia = parsed.data.talonarioFarmacia.trim();

  let customer;
  if (esTalonario) {
    // Pedido en papel de una farmacia que no es clienta: cuelga del cliente
    // genérico, pero el pedido guarda el nombre real que venga escrito.
    if (!nombreFarmacia) {
      return { fieldErrors: { talonarioFarmacia: 'Pon el nombre de la farmacia del talonario' } };
    }
    customer = await asegurarClienteMostrador();
  } else {
    if (!parsed.data.customerId) {
      return { fieldErrors: { customerId: 'Selecciona un cliente' } };
    }
    customer = await prisma.customer.findUnique({ where: { id: parsed.data.customerId } });
    if (!customer) return { error: 'Cliente no encontrado' };
    // Los pedidos de prueba pueden usar clientes desactivados (p.ej. un
    // cliente demo que no quieres que aparezca en descubrir/tienda real).
    if (!customer.active && !isTest) {
      return { error: 'Este cliente está desactivado. Actívalo antes de crear un pedido.' };
    }
  }

  let rawItems: unknown[];
  try {
    rawItems = JSON.parse(parsed.data.itemsJson);
    if (!Array.isArray(rawItems)) throw new Error('bad');
  } catch {
    return { error: 'Datos de las pulseras inválidos.' };
  }

  const parsedItems: Array<z.infer<typeof itemSchema>> = [];
  for (let i = 0; i < rawItems.length; i++) {
    const it = itemSchema.safeParse(rawItems[i]);
    if (!it.success) {
      return { error: `Pulsera #${i + 1}: ${it.error.issues[0].message}` };
    }
    parsedItems.push(it.data);
  }
  if (parsedItems.length === 0) return { error: 'Añade al menos una pulsera al pedido' };

  // Reutilizamos el mismo motor de precios de la tienda para que los
  // pedidos manuales lleven exactamente los mismos importes que los web.
  const cartInput = parsedItems.map((it, idx) => ({
    id: `manual-${idx}`,
    color: it.color,
    quantity: it.quantity,
    line1: it.line1,
    line2: it.line2 ?? '',
    line3: it.line3 ?? '',
  }));

  const { items, totals } = await priceCart(cartInput);

  const order = await crearPedidoNumerado((numeroDePedido) => prisma.order.create({
    data: {
      number: numeroDePedido,
      customerId: customer.id,
      pharmacyName: esTalonario ? nombreFarmacia : customer.pharmacyName,
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
      adminNotes: esTalonario
        ? notaDeTalonario(parsed.data.talonarioRef, parsed.data.adminNote)
        : parsed.data.adminNote || null,
      source: 'ADMIN',
      // Un pedido de talonario llega en papel: el canal es NOTE, se ponga lo
      // que se ponga en el desplegable.
      channel: esTalonario ? 'NOTE' : parsed.data.channel,
      createdByAdmin: session.email,
      isTest,
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

  // Los pedidos de PRUEBA NO tocan el stock real.
  if (!isTest) {
    await decrementStockForOrder(
      order.id,
      order.items.map((it) => ({ color: it.color, quantity: it.quantity })),
    ).catch(() => null);
  }

  // Emails. En modo prueba, TODO va al admin que lo crea (para verificar
  // que llega sin molestar al cliente ni al buzón de pedidos real).
  const recipients = isTest
    ? [session.email]
    : parseRecipients(await getSetting(SETTING_KEYS.ORDERS_RECIPIENT_EMAILS));
  const settings = await getSettings();
  const deliveryDays = settings[SETTING_KEYS.DELIVERY_DAYS];

  // Del pedido, no del formulario. En un talonario el canal guardado se
  // fuerza a NOTE y el nombre real de la farmacia va en order.pharmacyName;
  // usando customer.* el aviso llegaba como «VARIOS · Mostrador» y con el
  // canal del desplegable, así que quien lo prepara no sabía de quién era.
  const channelLabel =
    CHANNEL_LABEL[order.channel as keyof typeof CHANNEL_LABEL] ?? CHANNEL_LABEL[parsed.data.channel];
  const testTag = isTest ? '[PRUEBA] ' : '';

  const itemsTable = order.items.map((it) => {
    const c = it.color === 'BLACK' ? 'Negra' : 'Roja';
    const eng = [it.line1, it.line2, it.line3].filter((l) => l && l.trim().length > 0).join('<br/>');
    return `<tr>
      <td style="padding:8px;border:1px solid #ebeef0;">${c}</td>
      <td style="padding:8px;border:1px solid #ebeef0;text-align:center;">${it.quantity}</td>
      <td style="padding:8px;border:1px solid #ebeef0;font-family:monospace;line-height:1.5;">${eng}</td>
      <td style="padding:8px;border:1px solid #ebeef0;text-align:right;">${formatEuros(it.lineTotalCents)}</td>
    </tr>`;
  }).join('');

  const totalsBlock = `
    <table style="margin-top:16px;width:100%;font-size:14px;">
      <tr><td style="padding:4px 0;color:#637787;">Subtotal (${totals.totalUnits} uds)</td><td style="text-align:right;">${formatEuros(order.subtotalCents)}</td></tr>
      ${order.discountCents > 0 ? `<tr><td style="padding:4px 0;color:#16a34a;">Descuento (${order.discountPct}%)</td><td style="text-align:right;color:#16a34a;">−${formatEuros(order.discountCents)}</td></tr>` : ''}
      <tr><td style="padding:4px 0;color:#637787;border-top:1px solid #ebeef0;">Base imponible</td><td style="text-align:right;border-top:1px solid #ebeef0;">${formatEuros(order.taxableBaseCents)}</td></tr>
      <tr><td style="padding:4px 0;color:#637787;">IVA (${order.vatPct}%)</td><td style="text-align:right;">${formatEuros(order.vatCents)}</td></tr>
      ${order.equivSurchargeCents > 0 ? `<tr><td style="padding:4px 0;color:#637787;">Recargo equivalencia (${order.equivSurchargePct}%)</td><td style="text-align:right;">${formatEuros(order.equivSurchargeCents)}</td></tr>` : ''}
      <tr><td style="padding:8px 0 0;font-weight:700;border-top:1px solid #ebeef0;">TOTAL</td><td style="text-align:right;padding-top:8px;font-weight:700;border-top:1px solid #ebeef0;">${formatEuros(order.totalCents)}</td></tr>
    </table>`;

  // Best-effort: el pedido manual ya está creado; un fallo de email no debe
  // tumbar la creación (se redirige igualmente a la ficha del pedido).
  try {
  await sendEmail({
    to: recipients,
    subject: `${testTag}Pedido MANUAL #${order.number} · ${order.pharmacyName} (${channelLabel})`,
    html: emailLayout(`
      ${isTest ? '<div style="margin:0 0 12px;padding:8px 12px;background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;color:#92400e;font-size:13px;font-weight:600;">⚠️ PEDIDO DE PRUEBA — no descuenta stock, no notifica al cliente</div>' : ''}
      <h2 style="margin:0 0 4px;font-size:22px;color:#14503b;">Pedido manual #${order.number}</h2>
      <p style="margin:0 0 16px;color:#637787;font-size:13px;">
        Creado desde admin por <strong>${session.email}</strong> · Canal: <strong>${channelLabel}</strong>
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0faf5;">
          <th align="left" style="padding:8px;border:1px solid #b7e6cf;">Color</th>
          <th align="center" style="padding:8px;border:1px solid #b7e6cf;width:70px;">Uds</th>
          <th align="left" style="padding:8px;border:1px solid #b7e6cf;">Texto grabado</th>
          <th align="right" style="padding:8px;border:1px solid #b7e6cf;width:90px;">Total</th>
        </tr></thead>
        <tbody>${itemsTable}</tbody>
      </table>
      ${totalsBlock}
      ${parsed.data.adminNote ? `<div style="margin-top:16px;padding:12px;background:#f6f7f8;border-left:3px solid #2a9b6e;border-radius:6px;"><strong>Nota interna:</strong><br/>${parsed.data.adminNote.replace(/</g, '&lt;')}</div>` : ''}
    `),
  });

  // Email de confirmación "al cliente". En modo prueba se redirige al
  // admin (mismo contenido que recibiría el cliente, pero a tu buzón).
  if (parsed.data.notify) {
    await sendEmail({
      to: isTest ? session.email : customer.email,
      subject: `${testTag}Confirmación de pedido #${order.number} · Lomhifar`,
      html: emailLayout(`
        <h2 style="margin:0 0 4px;font-size:22px;color:#921a5e;">Confirmación de su pedido</h2>
        <p style="margin:0 0 16px;color:#54545f;font-size:14px;">Referencia <strong>#${order.number}</strong></p>
        <p style="margin:0 0 16px;line-height:1.6;">
          Hemos registrado su pedido. A continuación encontrará el detalle. Nuestro equipo
          lo procesará en las próximas horas hábiles. Plazo estimado de entrega:
          <strong>${deliveryDays} días laborables</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#fce7f4;">
            <th align="left" style="padding:8px;border:1px solid #f8a8d4;">Color</th>
            <th align="center" style="padding:8px;border:1px solid #f8a8d4;width:70px;">Uds</th>
            <th align="left" style="padding:8px;border:1px solid #f8a8d4;">Texto grabado</th>
            <th align="right" style="padding:8px;border:1px solid #f8a8d4;width:90px;">Total</th>
          </tr></thead>
          <tbody>${itemsTable}</tbody>
        </table>
        ${totalsBlock}
      `),
    });
  }
  } catch (err) {
    console.error('[pedido-manual] Fallo al enviar los emails del pedido manual (el pedido SÍ se ha creado):', err);
  }

  revalidatePath('/admin/pedidos');
  redirect(`/admin/pedidos/${order.id}?creado=1`);
}
