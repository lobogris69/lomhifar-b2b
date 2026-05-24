import Link from 'next/link';
import { ClipboardList, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate, formatEuros } from '@/lib/utils';
import { OrderStatusBadge, ORDER_STATUS_LABEL } from '@/components/shop/OrderStatusBadge';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pedidos · Admin Lomhifar' };

const PAGE_SIZE = 50;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; from?: string; to?: string; page?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const status = (searchParams.status ?? '').trim();
  const from = (searchParams.from ?? '').trim();
  const to = (searchParams.to ?? '').trim();
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

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

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    dateFilter.lte = d;
  }
  if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

  const [totalFiltered, totalAll, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.count({}),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const showingFrom = totalFiltered === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(totalFiltered, page * PAGE_SIZE);

  // URL para descargar el CSV con los mismos filtros aplicados
  const exportParams = new URLSearchParams();
  if (q) exportParams.set('q', q);
  if (status) exportParams.set('status', status);
  if (from) exportParams.set('from', from);
  if (to) exportParams.set('to', to);
  const exportUrl = `/api/admin/pedidos/export${exportParams.toString() ? '?' + exportParams.toString() : ''}`;

  function pageHref(p: number): string {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (status) sp.set('status', status);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/admin/pedidos${qs ? '?' + qs : ''}`;
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-brand-700" /> Pedidos
            <span className="text-ink-500 font-normal text-base">({totalAll.toLocaleString('es-ES')})</span>
          </h1>
          <p className="section-subtitle">
            Histórico completo de pedidos B2B.
            {totalFiltered !== totalAll && (
              <> · <strong>{totalFiltered.toLocaleString('es-ES')}</strong> coinciden con los filtros.</>
            )}
          </p>
        </div>
        <a href={exportUrl} className="btn-secondary" download>
          <Download className="h-4 w-4" /> Exportar a Excel (CSV)
        </a>
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
        <div>
          <label className="label" htmlFor="from">Desde</label>
          <input id="from" name="from" type="date" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="to">Hasta</label>
          <input id="to" name="to" type="date" defaultValue={to} className="input" />
        </div>
        <button type="submit" className="btn-primary">Filtrar</button>
        {(q || status || from || to) && (
          <Link href="/admin/pedidos" className="btn-ghost text-xs">Limpiar</Link>
        )}
      </form>

      <div className="card overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-ink-500">No hay pedidos con esos filtros.</div>
        ) : (
          <>
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-ink-100 bg-ink-50/40">
                <div className="text-xs text-ink-500">
                  Mostrando <strong>{showingFrom.toLocaleString('es-ES')}-{showingTo.toLocaleString('es-ES')}</strong> de{' '}
                  <strong>{totalFiltered.toLocaleString('es-ES')}</strong>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} pageHref={pageHref} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageHref,
}: {
  currentPage: number;
  totalPages: number;
  pageHref: (p: number) => string;
}) {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = currentPage - 2; i <= currentPage + 2; i += 1) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);

  return (
    <nav className="flex items-center gap-1 text-sm">
      {currentPage > 1 ? (
        <Link href={pageHref(currentPage - 1)} className="btn-ghost text-xs">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="btn-ghost text-xs opacity-30 cursor-not-allowed">
          <ChevronLeft className="h-3.5 w-3.5" />
        </span>
      )}
      {sorted.map((p, idx) => (
        <span key={p} className="flex items-center gap-1">
          {idx > 0 && p - sorted[idx - 1] > 1 && <span className="text-ink-400 px-1">…</span>}
          {p === currentPage ? (
            <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded bg-brand-700 text-white text-xs font-semibold px-2">
              {p}
            </span>
          ) : (
            <Link href={pageHref(p)} className="inline-flex h-7 min-w-[28px] items-center justify-center rounded text-ink-700 text-xs hover:bg-ink-100 px-2">
              {p}
            </Link>
          )}
        </span>
      ))}
      {currentPage < totalPages ? (
        <Link href={pageHref(currentPage + 1)} className="btn-ghost text-xs">
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="btn-ghost text-xs opacity-30 cursor-not-allowed">
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
    </nav>
  );
}
