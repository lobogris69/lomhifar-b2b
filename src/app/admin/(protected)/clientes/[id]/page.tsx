import Link from 'next/link';
import { ArrowLeft, ClipboardList, TrendingUp, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDate, formatEuros } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { CustomerForm } from '../CustomerForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Editar cliente · Admin Lomhifar' };

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const c = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!c) notFound();

  // Estadísticas + pedidos del cliente
  const [orders, agg, lastOrder] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: c.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { items: true },
    }),
    prisma.order.aggregate({
      where: { customerId: c.id, status: { not: 'CANCELLED' } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    prisma.order.findFirst({
      where: { customerId: c.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <Link href="/admin/clientes" className="inline-flex items-center text-sm text-ink-500 hover:text-ink-800 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a clientes
      </Link>
      <h1 className="section-title mb-1">{c.pharmacyName}</h1>
      <p className="section-subtitle mb-6">
        CIF <span className="font-mono text-ink-800">{c.cif}</span> · {c.email}
      </p>

      {/* Stats rápidas */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat
          icon={ClipboardList}
          label="Pedidos totales"
          value={agg._count._all.toString()}
        />
        <Stat
          icon={TrendingUp}
          label="Facturación"
          value={formatEuros(agg._sum.totalCents ?? 0)}
        />
        <Stat
          icon={Calendar}
          label="Último pedido"
          value={lastOrder ? formatDate(lastOrder.createdAt).split(' ')[0] : '—'}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Formulario edición */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-900 mb-4">Datos del cliente</h2>
            <CustomerForm customer={c} />
          </div>
        </div>

        {/* Pedidos del cliente */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-900">
                Pedidos ({orders.length}{orders.length === 20 ? '+' : ''})
              </h2>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-500">
                Este cliente aún no ha hecho pedidos.
              </div>
            ) : (
              <ul className="divide-y divide-ink-100 max-h-[600px] overflow-y-auto">
                {orders.map((o) => {
                  const units = o.items.reduce((a, b) => a + b.quantity, 0);
                  return (
                    <li key={o.id} className="p-4 hover:bg-ink-50/50">
                      <Link href={`/admin/pedidos/${o.id}`} className="block">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold text-brand-700 hover:underline">#{o.number}</span>
                          <span className="text-xs text-ink-500">{formatDate(o.createdAt)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                          <span className="text-ink-600">{o.items.length} líneas · {units} ud</span>
                          <span className="font-medium text-ink-900">{formatEuros(o.totalCents)}</span>
                        </div>
                        <div className="mt-1.5">
                          <OrderStatusBadge status={o.status} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 shrink-0">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-ink-500">{label}</div>
        <div className="text-lg font-semibold text-ink-900 truncate">{value}</div>
      </div>
    </div>
  );
}
