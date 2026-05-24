import { prisma } from './prisma';

export interface MonthBucket {
  month: string;      // ISO YYYY-MM
  label: string;      // ej "Ene"
  count: number;
  totalCents: number;
}

/**
 * Devuelve los últimos N meses con totales de pedidos y facturación.
 * Incluye meses vacíos (count=0) para que el gráfico sea continuo.
 */
export async function getMonthlyOrderStats(months = 6): Promise<MonthBucket[]> {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    buckets.push({ month: monthIso, label: capitalize(label), count: 0, totalCents: 0 });
  }

  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: from },
      status: { not: 'CANCELLED' },
    },
    select: { createdAt: true, totalCents: true },
  });

  for (const o of orders) {
    const m = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const b = buckets.find((x) => x.month === m);
    if (b) {
      b.count += 1;
      b.totalCents += o.totalCents;
    }
  }
  return buckets;
}

export interface TopCustomerRow {
  customerId: string;
  pharmacyName: string;
  cif: string;
  orderCount: number;
  totalCents: number;
}

export async function getTopCustomers(limit = 5): Promise<TopCustomerRow[]> {
  const grouped = await prisma.order.groupBy({
    by: ['customerId'],
    where: { status: { not: 'CANCELLED' } },
    _count: { _all: true },
    _sum: { totalCents: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const customers = await prisma.customer.findMany({
    where: { id: { in: grouped.map((g) => g.customerId) } },
    select: { id: true, pharmacyName: true, cif: true },
  });
  const byId = new Map(customers.map((c) => [c.id, c]));

  return grouped.map((g) => {
    const c = byId.get(g.customerId);
    return {
      customerId: g.customerId,
      pharmacyName: c?.pharmacyName ?? '(eliminado)',
      cif: c?.cif ?? '',
      orderCount: g._count._all,
      totalCents: g._sum.totalCents ?? 0,
    };
  });
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export async function getOrdersByStatus(): Promise<StatusBreakdown[]> {
  const grouped = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  return grouped.map((g) => ({ status: g.status, count: g._count._all }));
}

export interface ColorBreakdown {
  color: string;       // BLACK | RED
  units: number;       // unidades totales
  lines: number;       // líneas de pedido
}

/**
 * Distribución de unidades por color (no pedidos, sino unidades fabricadas).
 * Excluye pedidos cancelados.
 */
export async function getUnitsByColor(): Promise<ColorBreakdown[]> {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { not: 'CANCELLED' } } },
    select: { color: true, quantity: true },
  });
  const map = new Map<string, { units: number; lines: number }>();
  for (const it of items) {
    const entry = map.get(it.color) ?? { units: 0, lines: 0 };
    entry.units += it.quantity;
    entry.lines += 1;
    map.set(it.color, entry);
  }
  return Array.from(map.entries()).map(([color, v]) => ({
    color,
    units: v.units,
    lines: v.lines,
  }));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
