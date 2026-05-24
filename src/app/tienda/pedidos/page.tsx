import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCustomerSession } from '@/lib/auth';
import { formatDate, formatEuros } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { PosterCalloutLarge } from '@/components/shop/PosterCallout';

export const metadata = { title: 'Mis pedidos · Lomhifar' };

export default async function OrdersPage() {
  const session = await getCustomerSession();
  const orders = await prisma.order.findMany({
    where: { customerId: session!.customer.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="section-title">Mis pedidos</h1>
      <p className="section-subtitle">Histórico de pedidos enviados a Lomhifar.</p>

      <div className="mt-6 mb-8">
        <PosterCalloutLarge />
      </div>

      <div className="mt-6 card overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-10 text-center text-ink-500">
            Aún no ha realizado ningún pedido.{' '}
            <Link href="/tienda" className="text-brand-700 font-medium">
              Hacer mi primer pedido
            </Link>
          </div>
        ) : (
          <table className="table-pro">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Pulseras</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const totalUnits = o.items.reduce((a, b) => a + b.quantity, 0);
                return (
                  <tr key={o.id}>
                    <td className="font-semibold text-ink-900">#{o.number}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>
                      {o.items.length} línea{o.items.length === 1 ? '' : 's'} ·{' '}
                      {totalUnits} ud
                    </td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="text-right font-medium">{formatEuros(o.totalCents)}</td>
                    <td className="text-right">
                      <Link
                        href={`/tienda/pedidos/${o.id}`}
                        className="text-brand-700 hover:underline text-sm"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
