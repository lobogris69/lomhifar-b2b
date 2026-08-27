import { prisma } from './prisma';
import { emailLayout, sendEmail } from './email';
import { getSetting, parseRecipients, SETTING_KEYS } from './settings';
import { colorLabel } from './cart';

/**
 * Asegura que existan los 2 registros base de stock (BLACK, RED).
 * Idempotente — se puede llamar en cualquier momento.
 */
export async function ensureStockBase(): Promise<void> {
  await prisma.stock.upsert({
    where: { color: 'BLACK' },
    create: { color: 'BLACK', quantity: 0, minAlertLevel: 50 },
    update: {},
  });
  await prisma.stock.upsert({
    where: { color: 'RED' },
    create: { color: 'RED', quantity: 0, minAlertLevel: 50 },
    update: {},
  });
}

export interface StockSummary {
  color: string;
  quantity: number;
  minAlertLevel: number;
  isLow: boolean;       // qty <= minAlertLevel
  isEmpty: boolean;     // qty <= 0
}

export async function getStockSummary(): Promise<StockSummary[]> {
  try {
    await ensureStockBase();
    const stocks = await prisma.stock.findMany({ orderBy: { color: 'asc' } });
    return stocks.map((s) => ({
      color: s.color,
      quantity: s.quantity,
      minAlertLevel: s.minAlertLevel,
      isLow: s.quantity <= s.minAlertLevel,
      isEmpty: s.quantity <= 0,
    }));
  } catch {
    // Resiliente si BD no lista (build, etc.)
    return [
      { color: 'BLACK', quantity: 0, minAlertLevel: 50, isLow: true, isEmpty: true },
      { color: 'RED', quantity: 0, minAlertLevel: 50, isLow: true, isEmpty: true },
    ];
  }
}

/**
 * Decrementa stock al confirmar un pedido. Registra movimiento por cada color.
 * Si alguno baja del nivel de alerta, envía email al admin (1 vez por hora máximo).
 */
export async function decrementStockForOrder(
  orderId: string,
  items: { color: string; quantity: number }[],
): Promise<void> {
  // Agrupar por color
  const byColor = new Map<string, number>();
  for (const it of items) {
    byColor.set(it.color, (byColor.get(it.color) ?? 0) + it.quantity);
  }

  await ensureStockBase();

  for (const [color, qty] of byColor.entries()) {
    const stock = await prisma.stock.findUnique({ where: { color } });
    if (!stock) continue;

    // `decrement` deja la resta en manos de la base de datos. Leer la
    // cantidad aquí y volver a escribirla parece igual, pero si entran dos
    // pedidos a la vez los dos leen el mismo número y el segundo pisa al
    // primero: se descuenta una vez y se sirven dos. Con `decrement` cada
    // uno resta lo suyo pase lo que pase.
    const actualizado = await prisma.$transaction([
      prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: qty } },
      }),
      prisma.stockMovement.create({
        data: {
          stockId: stock.id,
          delta: -qty,
          reason: 'PEDIDO',
          orderId,
          note: `Pedido nº ${orderId.slice(-6)}`,
        },
      }),
    ]);
    const newQty = actualizado[0].quantity;

    // Alerta si bajamos del umbral (y no hemos avisado en la última hora)
    if (newQty <= stock.minAlertLevel) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (!stock.lastAlertedAt || stock.lastAlertedAt < hourAgo) {
        await sendLowStockAlert(color, newQty, stock.minAlertLevel).catch(() => null);
        await prisma.stock.update({
          where: { id: stock.id },
          data: { lastAlertedAt: new Date() },
        }).catch(() => null);
      }
    }
  }
}

async function sendLowStockAlert(color: string, qty: number, minLevel: number): Promise<void> {
  const recipients = parseRecipients(
    await getSetting(SETTING_KEYS.ORDERS_RECIPIENT_EMAILS),
  );
  const label = colorLabel(color);
  const isEmpty = qty <= 0;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  await sendEmail({
    to: recipients,
    subject: isEmpty
      ? `⚠️ STOCK AGOTADO: pulsera ${label}`
      : `⚠️ Stock bajo: pulsera ${label} (${qty} restantes)`,
    html: emailLayout(`
      <h2 style="margin:0 0 12px;color:#921a5e;">
        ${isEmpty ? 'Stock AGOTADO' : 'Aviso de stock bajo'}
      </h2>
      <p style="font-size:15px;margin:0 0 14px;">
        La pulsera <strong>${label}</strong> tiene actualmente
        <strong style="color:${isEmpty ? '#dc2626' : '#d97706'};">${qty} unidades</strong>
        en stock (nivel mínimo configurado: ${minLevel}).
      </p>
      ${isEmpty
        ? `<p style="background:#fee2e2;border-left:3px solid #dc2626;padding:12px;border-radius:6px;font-size:14px;">
            <strong>Los clientes ya están viendo un aviso en el configurador.</strong>
            Los pedidos NO se bloquean, pero el cliente sabe que no hay disponibilidad inmediata.
          </p>`
        : `<p style="color:#54545f;font-size:13px;">Reponer pronto para evitar quiebre de stock.</p>`}
      <p style="margin-top:24px;">
        <a href="${baseUrl}/admin/stock" style="display:inline-block;background:linear-gradient(135deg,#921a5e 0%,#d12686 100%);color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;">
          Gestionar stock
        </a>
      </p>
    `, { preheader: `Pulsera ${label}: ${qty} unidades restantes` }),
  });
}
