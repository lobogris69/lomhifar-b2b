import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCustomerSession } from '@/lib/auth';
import { formatDate, formatEuros } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { PosterCalloutLarge } from '@/components/shop/PosterCallout';
import { colorLabel } from '@/lib/cart';

export const metadata = { title: 'Detalle de pedido · Lomhifar' };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nuevo?: string };
}) {
  const session = await getCustomerSession();
  const order = await prisma.order.findFirst({
    where: { id: params.id, customerId: session!.customer.id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/tienda/pedidos" className="inline-flex items-center text-sm text-ink-500 hover:text-ink-800 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver al histórico
      </Link>

      {searchParams.nuevo && (
        <>
          <Alert variant="success" title="¡Pedido enviado correctamente!" className="mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Hemos enviado el pedido a Lomhifar y le hemos remitido una copia por email.
            </div>
          </Alert>

          <div className="mb-8">
            <PosterCalloutLarge />
          </div>
        </>
      )}

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-400">Pedido</div>
            <div className="text-2xl font-semibold text-ink-900">#{order.number}</div>
            <div className="text-sm text-ink-500 mt-1">{formatDate(order.createdAt)}</div>
          </div>
          <OrderStatusBadge status={order.status} className="text-sm" />
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-base font-semibold text-ink-900 mb-4">Pulseras del pedido</h2>
        <div className="overflow-x-auto">
          <table className="table-pro">
            <thead>
              <tr>
                <th>Color</th>
                <th className="text-center">Uds</th>
                <th>Línea 1</th>
                <th>Línea 2</th>
                <th className="text-right">Precio ud.</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td>{colorLabel(it.color)}</td>
                  <td className="text-center">{it.quantity}</td>
                  <td className="font-mono">{it.line1}</td>
                  <td className="font-mono">{it.line2 || '—'}</td>
                  <td className="text-right">{formatEuros(it.unitPriceCents)}</td>
                  <td className="text-right font-medium">{formatEuros(it.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-6 ml-auto max-w-xs text-sm space-y-2">
          <div className="flex items-center justify-between">
            <dt className="text-ink-500">Subtotal</dt>
            <dd>{formatEuros(order.subtotalCents)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-500">Portes</dt>
            <dd>{order.shippingCents === 0 ? 'Gratis' : formatEuros(order.shippingCents)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-ink-100 pt-2">
            <dt className="font-semibold">Total</dt>
            <dd className="text-lg font-semibold text-brand-800">{formatEuros(order.totalCents)}</dd>
          </div>
        </dl>
      </div>

      {order.customerNote && (
        <div className="card p-6 mb-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-2">Comentario al pedido</h3>
          <p className="text-sm text-ink-700 whitespace-pre-line">{order.customerNote}</p>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-ink-900 mb-3">Datos de envío</h3>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <Detail label="Farmacia" value={order.pharmacyName} />
          <Detail label="CIF" value={order.cif} />
          <Detail label="Email" value={order.email} />
          {order.contactName && <Detail label="Contacto" value={order.contactName} />}
          {order.phone && <Detail label="Teléfono" value={order.phone} />}
          {order.address && (
            <Detail
              label="Dirección"
              value={[order.address, order.city, order.postalCode, order.province].filter(Boolean).join(', ')}
              className="sm:col-span-2"
            />
          )}
        </dl>
      </div>
    </div>
  );
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className="text-ink-900 font-medium">{value}</dd>
    </div>
  );
}
