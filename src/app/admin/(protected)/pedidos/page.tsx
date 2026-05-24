import Link from 'next/link';
import { ClipboardList, Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate, formatEuros } from '@/lib/utils';
import { OrderStatusBadge, ORDER_STATUS_LABEL } from '@/components/shop/OrderStatusBadge';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pedidos · Admin Lomhifar' };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const status = (searchParams.status ?? '').trim();

  const where: Record<string, unknown> = {};
  if (q) {
    const num = Number(q);
    where.OR = [
      { pharmacyName: { contains: q } },
      { cif: { contains: q } },
      { email: { contains: q } },
      ...(Number.isFinite(num) ? [{ number: num }] : []),
    ];
  }
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { items: true },
  });

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <h1 className="section-title flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-brand-700" /> Pedidos
        </h1>
        <p className="section-subtitle">Histórico completo de pedidos B2B.</p>
      </div>

      <form className="card p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="label" htmlFor="q">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input id="q" name="q" defaultValue={q} placeholder="Nº pedido, farmacia, CIF…" className="input pl-9" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="status">Estado</label>
          <select id="status" name="status" defaultValue={status ?? ''} className="input">
            <option value="">Todos</option>
            {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">Filtrar</button>
      </form>

      <div className="card overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-ink-500">No hay pedidos con esos filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Farmacia</th>
                  <th>CIF</th>
                  <th>Pulseras</th>
                  <th>Estado</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const units = o.items.reduce((a, b) => a + b.quantity, 0);
                  return (
                    <tr key={o.id} className="cursor-pointer">
                      <td>
                        <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-brand-700 hover:underline">
                          #{o.number}
                        </Link>
                      </td>
                      <td>{formatDate(o.createdAt)}</td>
                      <td>{o.pharmacyName}</td>
                      <td className="font-mono">{o.cif}</td>
                      <td>{o.items.length} líneas · {units} ud</td>
                      <td><OrderStatusBadge status={o.status} /></td>
                      <td className="text-right font-medium">{formatEuros(o.totalCents)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
