import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Repeat2, Truck, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCustomerSession } from '@/lib/auth';
import { formatDate, formatEuros } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { PosterCalloutLarge } from '@/components/shop/PosterCallout';
import { colorLabel } from '@/lib/cart';
import { reorderAction } from './actions';
import { getAllSiteTexts } from '@/lib/site-texts';

export const metadata = { title: 'Detalle de pedido · Lomhifar' };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nuevo?: string };
}) {
  const session = await getCustomerSession();
  const [order, t] = await Promise.all([
    prisma.order.findFirst({
      where: { id: params.id, customerId: session!.customer.id },
      include: {
        items: true,
        trackingEvents: { orderBy: { eventAt: 'desc' } },
      },
    }),
    getAllSiteTexts(),
  ]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/tienda/pedidos" className="inline-flex items-center text-sm text-ink-500 hover:text-ink-800 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver al histórico
      </Link>

      {searchParams.nuevo && (
        <>
          <Alert variant="success" title={t['pedido_ok.titulo']} className="mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              {t['pedido_ok.descripcion']}
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
          <div className="flex items-center gap-3 flex-wrap">
            <OrderStatusBadge status={order.status} className="text-sm" />
            <form action={reorderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <button
                type="submit"
                className="btn-secondary"
                title="Añadir todas las pulseras de este pedido al carrito"
              >
                <Repeat2 className="h-4 w-4" /> Volver a pedir
              </button>
            </form>
          </div>
        </div>

        {order.trackingNumber && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 flex items-center gap-3 flex-wrap">
            <Truck className="h-5 w-5 text-emerald-700 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">
                {order.lastTrackingLabel ?? 'Pedido en camino'}
              </div>
              <div className="text-sm font-mono text-ink-900 break-all">
                {order.trackingNumber}
              </div>
              {order.lastTrackingAt && (
                <div className="text-[11px] text-emerald-700">
                  Última actualización: {formatDate(order.lastTrackingAt)}
                </div>
              )}
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs whitespace-nowrap"
              >
                Seguir envío <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Timeline de eventos de tracking (poblado por webhook InPost) */}
        {order.trackingEvents.length > 0 && (
          <div className="mt-4 p-5 rounded-xl bg-white border border-ink-100">
            <h3 className="text-sm font-semibold text-ink-900 mb-3">
              Historial de envío
            </h3>
            <ol className="relative border-l-2 border-ink-100 ml-2 space-y-3">
              {order.trackingEvents.map((ev, idx) => {
                const isLast = idx === 0; // primer item (orderBy desc) = más reciente
                const dotColor =
                  ev.eventCode.startsWith('EOL.1') ? 'bg-emerald-500'
                  : ev.eventCode.startsWith('LMD.9') || ev.eventCode.startsWith('EOL.9') ? 'bg-red-500'
                  : ev.eventCode.startsWith('LMD.10') ? 'bg-emerald-500'
                  : isLast ? 'bg-brand-600'
                  : 'bg-ink-300';
                return (
                  <li key={ev.id} className="pl-5 relative">
                    <span
                      className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ${dotColor} ring-4 ring-white`}
                      aria-hidden
                    />
                    <div className={`text-sm ${isLast ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>
                      {ev.eventLabel}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5">
                      {formatDate(ev.eventAt)} · <span className="font-mono">{ev.eventCode}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-base font-semibold text-ink-900 mb-4">Pulseras del pedido</h2>
        <div className="overflow-x-auto">
          <table className="table-pro">
            <thead>
              <tr>
                <th>Color</th>
                <th className="text-center">Uds</th>
                <th>Texto grabado</th>
                <th className="text-right">Precio ud.</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => {
                const lines = [it.line1, it.line2, it.line3].filter((l) => l && l.trim().length > 0);
                return (
                  <tr key={it.id}>
                    <td>{colorLabel(it.color)}</td>
                    <td className="text-center">{it.quantity}</td>
                    <td className="font-mono leading-snug">
                      {lines.map((l, i) => (
                        <div key={i}>{l}</div>
                      ))}
                    </td>
                    <td className="text-right">{formatEuros(it.unitPriceCents)}</td>
                    <td className="text-right font-medium">{formatEuros(it.lineTotalCents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <dl className="mt-6 ml-auto max-w-sm text-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <dt className="text-ink-500">Subtotal</dt>
            <dd>{formatEuros(order.subtotalCents)}</dd>
          </div>
          {order.discountCents > 0 && (
            <div className="flex items-center justify-between text-emerald-700">
              <dt>Descuento volumen{order.discountPct ? ` (${order.discountPct}%)` : ''}</dt>
              <dd className="font-semibold">−{formatEuros(order.discountCents)}</dd>
            </div>
          )}
          {order.shippingCents > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">Portes</dt>
              <dd>{formatEuros(order.shippingCents)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-ink-100 pt-1.5">
            <dt className="text-ink-500 text-xs">Base imponible</dt>
            <dd className="text-ink-700 text-xs">{formatEuros(order.taxableBaseCents)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-500 text-xs">IVA ({order.vatPct}%)</dt>
            <dd className="text-ink-700 text-xs">{formatEuros(order.vatCents)}</dd>
          </div>
          {order.equivSurchargeCents > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-ink-500 text-xs">Recargo equivalencia ({order.equivSurchargePct}%)</dt>
              <dd className="text-ink-700 text-xs">{formatEuros(order.equivSurchargeCents)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between border-t-2 border-ink-200 pt-2">
            <dt className="font-semibold text-ink-900">TOTAL</dt>
            <dd className="text-xl font-bold text-brand-800">{formatEuros(order.totalCents)}</dd>
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
