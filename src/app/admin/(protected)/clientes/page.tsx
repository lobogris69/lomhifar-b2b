import Link from 'next/link';
import { Plus, Search, Users, Edit, Power, Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { toggleCustomerActive, deleteCustomer } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clientes · Admin Lomhifar' };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const status = searchParams.status ?? '';

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

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-700" />
            Clientes ({customers.length})
          </h1>
          <p className="section-subtitle">Base de farmacias activas e inactivas.</p>
        </div>
        <Link href="/admin/clientes/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" /> Añadir cliente
        </Link>
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
      </form>

      <div className="card overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center text-ink-500">No hay clientes con esos filtros.</div>
        ) : (
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
                    <td>{c.email}</td>
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
        )}
      </div>
    </div>
  );
}
