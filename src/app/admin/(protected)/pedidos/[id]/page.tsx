import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate, formatEuros } from '@/lib/utils';
import { colorLabel } from '@/lib/cart';
import { OrderStatusBadge, ORDER_STATUS_LABEL } from '@/components/shop/OrderStatusBadge';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { PrintButton } from '@/components/admin/PrintButton';
import { CARRIERS, DEFAULT_CARRIER } from '@/lib/shipping';
import { isMondialRelayEnabled } from '@/lib/mondial-relay';
import { saveAdminNotes, saveTracking, updateOrderStatus } from '../actions';
import { Truck, ExternalLink } from 'lucide-react';
import { GenerateMondialRelayLabel } from './GenerateMondialRelayLabel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pedido · Admin Lomhifar' };

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const [order, mrEnabled] = await Promise.all([
    prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, customer: true },
    }),
    isMondialRelayEnabled(),
  ]);
  if (!order) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl">
      <Link href="/admin/pedidos" className="inline-flex items-center text-sm text-ink-500 hover:text-ink-800 mb-4 no-print">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a pedidos
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="section-title">Pedido #{order.number}</h1>
          <p className="section-subtitle">
            {formatDate(order.createdAt)} · {order.pharmacyName}
          </p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <PrintButton />
          <OrderStatusBadge status={order.status} className="text-sm" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-900 mb-4">Pulseras a fabricar</h2>

            {/* Vista previa visual — crítica para producción */}
            <div className="space-y-5 mb-6">
              {order.items.map((it, idx) => (
                <div key={it.id} className="border border-ink-100 rounded-xl p-4 bg-ink-50/40">
                  <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                    <div className="text-sm font-semibold text-ink-900">
                      Línea {idx + 1}: <span className="text-brand-700">{colorLabel(it.color)}</span>{' '}
                      × <span className="text-brand-700">{it.quantity}</span> uds
                    </div>
                    <div className="text-sm font-semibold text-brand-800">
                      {formatEuros(it.lineTotalCents)}
                    </div>
                  </div>
                  <BraceletPreview color={it.color} line1={it.line1} line2={it.line2} size="md" />
                </div>
              ))}
            </div>

            {/* Tabla resumen para impresión */}
            <div className="overflow-x-auto">
              <table className="table-pro">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th className="text-center">Uds</th>
                    <th>Texto grabado (1-3 líneas)</th>
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
                        <td className="text-right font-medium">{formatEuros(it.lineTotalCents)}</td>
                      </tr>
                    );
                  })}
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
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-ink-900 mb-2">Comentario del cliente</h3>
              <p className="text-sm whitespace-pre-line">{order.customerNote}</p>
            </div>
          )}

          <form action={saveAdminNotes} className="card p-6 space-y-3 no-print">
            <input type="hidden" name="id" value={order.id} />
            <label className="label" htmlFor="adminNotes">Notas internas</label>
            <textarea
              id="adminNotes"
              name="adminNotes"
              rows={3}
              className="input"
              defaultValue={order.adminNotes ?? ''}
              placeholder="Notas internas no visibles para el cliente"
            />
            <div className="text-right">
              <button type="submit" className="btn-secondary">Guardar notas</button>
            </div>
          </form>
        </div>

        <div className="space-y-6 no-print">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-ink-900 mb-3">Cambiar estado</h3>
            <form action={updateOrderStatus} className="space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status} className="input">
                {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="notify" defaultChecked className="h-4 w-4" />
                Notificar al cliente por email
              </label>
              <button type="submit" className="btn-primary w-full">Actualizar estado</button>
            </form>
          </div>

          {/* Generación automática de etiqueta via API Mondial Relay */}
          {mrEnabled && !order.trackingNumber && order.postalCode && (
            <GenerateMondialRelayLabel orderId={order.id} destCP={order.postalCode} />
          )}

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-brand-700" />
              <h3 className="text-sm font-semibold text-ink-900">Tracking del envío</h3>
            </div>
            {order.trackingNumber ? (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
                <div className="text-emerald-900 font-semibold">
                  Nº de seguimiento: <span className="font-mono">{order.trackingNumber}</span>
                </div>
                {order.shippedAt && (
                  <div className="text-emerald-800 text-xs mt-1">
                    Enviado el {formatDate(order.shippedAt)}
                  </div>
                )}
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                  >
                    Ver tracking <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : null}

            <form action={saveTracking} className="space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <div>
                <label className="label text-xs" htmlFor="carrier">Transportista</label>
                <select id="carrier" name="carrier" defaultValue={DEFAULT_CARRIER} className="input">
                  {CARRIERS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs" htmlFor="trackingNumber">Nº de seguimiento</label>
                <input
                  id="trackingNumber"
                  name="trackingNumber"
                  defaultValue={order.trackingNumber ?? ''}
                  placeholder="ej. 6090123456789"
                  className="input font-mono"
                />
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-ink-500">Si elegiste &laquo;Otro&raquo;: URL completa</summary>
                <input
                  name="customUrl"
                  type="url"
                  placeholder="https://..."
                  className="input mt-2 text-xs"
                />
              </details>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="notify" defaultChecked className="h-4 w-4" />
                Enviar email al cliente con el tracking
              </label>
              <button type="submit" className="btn-primary w-full">
                Guardar tracking {!order.trackingNumber ? 'y marcar enviado' : ''}
              </button>
            </form>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-ink-900 mb-3">Farmacia</h3>
            <dl className="text-sm space-y-2">
              <KV k="Farmacia" v={order.pharmacyName} />
              <KV k="CIF" v={order.cif} />
              <KV k="Email" v={order.email} />
              {order.contactName && <KV k="Contacto" v={order.contactName} />}
              {order.phone && <KV k="Teléfono" v={order.phone} />}
              {order.address && <KV k="Dirección" v={`${order.address}${order.city ? ', ' + order.city : ''}${order.postalCode ? ' (' + order.postalCode + ')' : ''}${order.province ? ' · ' + order.province : ''}`} />}
            </dl>
            <Link href={`/admin/clientes/${order.customerId}`} className="mt-4 inline-block text-sm text-brand-700 hover:underline">
              Ver ficha del cliente →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-ink-400">{k}</dt>
      <dd className="text-ink-900 font-medium">{v}</dd>
    </div>
  );
}
