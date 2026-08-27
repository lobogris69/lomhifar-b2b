import Link from 'next/link';
import {
  Users, ClipboardList, Building2, FileSpreadsheet, ArrowRight, TrendingUp, Trophy,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Alert } from '@/components/ui/Alert';
import { formatDate, formatEuros } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { MonthlyChart } from '@/components/admin/MonthlyChart';
import { ColorBreakdownCard } from '@/components/admin/ColorBreakdownCard';
import { getMonthlyOrderStats, getTopCustomers, getUnitsByColor } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: { sinpermiso?: string };
}) {
  const [
    customers,
    pendingApps,
    recentOrders,
    totalOrders,
    revenueAgg,
    monthly,
    topCustomers,
    monthlyOrdersCurrent,
    colorBreakdown,
  ] = await Promise.all([
    prisma.customer.count({ where: { active: true } }),
    prisma.pharmacyApplication.count({ where: { status: 'PENDING' } }),
    prisma.order.findMany({
      take: 5, orderBy: { createdAt: 'desc' }, include: { items: true },
    }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { not: 'CANCELLED' } },
    }),
    getMonthlyOrderStats(6),
    getTopCustomers(5),
    prisma.order.count({
      where: {
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        status: { not: 'CANCELLED' },
      },
    }),
    getUnitsByColor(),
  ]);

  const currentMonthRevenue = monthly[monthly.length - 1]?.totalCents ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8">
      {/* Aquí acaba quien intenta entrar en una sección que su rol no tiene.
          Antes esas páginas se abrían igual escribiendo la URL a mano. */}
      {searchParams?.sinpermiso && (
        <Alert variant="warning">
          Esa sección no está disponible para tu tipo de cuenta. Si necesitas entrar,
          pídele a un administrador que te cambie el rol.
        </Alert>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Resumen</h1>
          <p className="section-subtitle">Panorámica de la actividad B2B Lomhifar</p>
        </div>
        <Link href="/admin/importar" className="btn-primary">
          <FileSpreadsheet className="h-4 w-4" /> Importar Excel de clientes
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Clientes activos" value={customers.toString()} icon={Users} href="/admin/clientes" />
        <Stat
          label="Solicitudes pendientes"
          value={pendingApps.toString()}
          icon={Building2}
          href="/admin/solicitudes"
          highlight={pendingApps > 0}
        />
        <Stat
          label="Pedidos este mes"
          value={monthlyOrdersCurrent.toString()}
          sub={`${formatEuros(currentMonthRevenue)} facturado`}
          icon={TrendingUp}
          href="/admin/pedidos"
        />
        <Stat
          label="Pedidos totales"
          value={totalOrders.toString()}
          sub={formatEuros(revenueAgg._sum.totalCents ?? 0)}
          icon={ClipboardList}
          href="/admin/pedidos"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MonthlyChart data={monthly} />
          <ColorBreakdownCard data={colorBreakdown} />
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-brand-700" />
            <h3 className="text-base font-semibold text-ink-900">Top 5 farmacias</h3>
          </div>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-ink-500">Aún no hay pedidos.</p>
          ) : (
            <ol className="space-y-3">
              {topCustomers.map((c, i) => (
                <li key={c.customerId} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-white text-[11px] font-semibold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/clientes/${c.customerId}`}
                      className="font-medium text-ink-900 hover:text-brand-700 truncate block"
                    >
                      {c.pharmacyName}
                    </Link>
                    <div className="text-xs text-ink-500">
                      {c.orderCount} pedidos · {formatEuros(c.totalCents)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="text-base font-semibold text-ink-900">Pedidos recientes</h2>
          <Link href="/admin/pedidos" className="text-sm text-brand-700 hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-10 text-center text-ink-500">Aún no hay pedidos.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="table-pro min-w-[640px]">
            <thead>
              <tr>
                <th>Pedido</th><th>Farmacia</th><th>Fecha</th><th>Uds.</th><th>Estado</th><th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => {
                const units = o.items.reduce((a, b) => a + b.quantity, 0);
                return (
                  <tr key={o.id}>
                    <td><Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-brand-700 hover:underline">#{o.number}</Link></td>
                    <td>{o.pharmacyName}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{units}</td>
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

function Stat({
  label, value, icon: Icon, href, highlight, sub,
}: {
  label: string; value: string; icon: React.ElementType; href: string;
  highlight?: boolean; sub?: string;
}) {
  return (
    <Link
      href={href}
      className={`card p-5 hover:shadow-soft transition-shadow ${highlight ? 'ring-2 ring-amber-400/40' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-ink-500">{label}</span>
        <Icon className="h-4 w-4 text-ink-400" />
      </div>
      <div className="mt-3 text-2xl font-semibold text-ink-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-500">{sub}</div>}
    </Link>
  );
}
