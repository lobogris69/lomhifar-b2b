import Link from 'next/link';
import { Plus, Search, Users, Edit, Power, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { toggleCustomerActive, deleteCustomer } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clientes · Admin Lomhifar' };

const PAGE_SIZE = 50;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const status = searchParams.status ?? '';
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { cif: { contains: q } },
      { email: { contains: q } },
      { pharmacyName: { contains: q } },
      { city: { contains: q } },
    ];
  }
  if (status === 'active') where.active = true;
  if (status === 'inactive') where.active = false;

  // Total real + página actual en paralelo
  const [totalFiltered, totalAll, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.count({}),
    prisma.customer.findMany({
      where,
      orderBy: { pharmacyName: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const showingFrom = totalFiltered === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(totalFiltered, page * PAGE_SIZE);

  const exportParams = new URLSearchParams();
  if (q) exportParams.set('q', q);
  if (status) exportParams.set('status', status);
  const exportUrl = `/api/admin/clientes/export${exportParams.toString() ? '?' + exportParams.toString() : ''}`;

  // Helper para construir links de paginación preservando filtros
  function pageHref(p: number): string {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (status) sp.set('status', status);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/admin/clientes${qs ? '?' + qs : ''}`;
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-700" />
            Clientes <span className="text-ink-500 font-normal">({totalAll.toLocaleString('es-ES')} totales)</span>
          </h1>
          <p className="section-subtitle">
            Base de farmacias activas e inactivas.
            {totalFiltered !== totalAll && (
              <> · <strong>{totalFiltered.toLocaleString('es-ES')}</strong> coinciden con los filtros.</>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={exportUrl} className="btn-secondary" download>
            <Download className="h-4 w-4" /> Exportar Excel
          </a>
          <Link href="/admin/clientes/nuevo" className="btn-primary">
            <Plus className="h-4 w-4" /> Añadir cliente
          </Link>
        </div>
      </div>

      <form className="card p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="label" htmlFor="q">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="CIF, email, farmacia, localidad…"
              className="input pl-9"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="status">Estado</label>
          <select id="status" name="status" defaultValue={status} className="input">
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">Filtrar</button>
        {(q || status) && (
          <Link href="/admin/clientes" className="btn-ghost text-xs">Limpiar</Link>
        )}
      </form>

      <div className="card overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center text-ink-500">No hay clientes con esos filtros.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-pro">
                <thead>
                  <tr>
                    <th>Farmacia</th>
                    <th>CIF</th>
                    <th>Email</th>
                    <th>Localidad</th>
                    <th>Origen</th>
                    <th>Estado</th>
                    <th>Alta</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.pharmacyName}</td>
                      <td className="font-mono">{c.cif}</td>
                      <td>{c.email || <span className="text-ink-400 italic">sin email</span>}</td>
                      <td>{[c.city, c.province].filter(Boolean).join(', ') || '—'}</td>
                      <td>
                        <span className="badge-muted text-[10px]">
                          {c.source === 'EXCEL' ? 'Excel' : c.source === 'APPLICATION' ? 'Alta web' : 'Manual'}
                        </span>
                      </td>
                      <td>
                        {c.active ? (
                          <span className="badge-success">Activo</span>
                        ) : (
                          <span className="badge-danger">Inactivo</span>
                        )}
                      </td>
                      <td className="text-ink-500 text-xs">{formatDate(c.createdAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link href={`/admin/clientes/${c.id}`} className="btn-ghost" title="Editar">
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                          <form action={toggleCustomerActive}>
                            <input type="hidden" name="id" value={c.id} />
                            <button type="submit" className="btn-ghost" title={c.active ? 'Desactivar' : 'Activar'}>
                              <Power className="h-3.5 w-3.5" />
                            </button>
                          </form>
                          <form action={deleteCustomer}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              className="btn-ghost text-danger"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
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
  // Mostrar siempre primera, última, actual y ±2 alrededor
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
          {idx > 0 && p - sorted[idx - 1] > 1 && (
            <span className="text-ink-400 px-1">…</span>
          )}
          {p === currentPage ? (
            <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded bg-brand-700 text-white text-xs font-semibold px-2">
              {p}
            </span>
          ) : (
            <Link
              href={pageHref(p)}
              className="inline-flex h-7 min-w-[28px] items-center justify-center rounded text-ink-700 text-xs hover:bg-ink-100 px-2"
            >
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
