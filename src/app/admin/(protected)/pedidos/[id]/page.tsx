import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate, formatEuros } from '@/lib/utils';
import { colorLabel } from '@/lib/cart';
import { OrderStatusBadge, ORDER_STATUS_LABEL } from '@/components/shop/OrderStatusBadge';
import { saveAdminNotes, updateOrderStatus } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pedido · Admin Lomhifar' };

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, customer: true },
  });
  if (!order) notFound();

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <Link href="/admin/pedidos" className="inline-flex items-center text-sm text-ink-500 hover:text-ink-800 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a pedidos
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="section-title">Pedido #{order.number}</h1>
          <p className="section-subtitle">
            {formatDate(order.createdAt)} · {order.pharmacyName}
          </p>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-900 mb-3">Pulseras</h2>
            <div className="overflow-x-auto">
              <table className="table-pro">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th className="text-center">Uds</th>
                    <th>Línea 1</th>
                    <th>Línea 2</th>
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
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-ink-900 mb-2">Comentario del cliente</h3>
              <p className="text-sm whitespace-pre-line">{order.customerNote}</p>
            </div>
          )}

          <form action={saveAdminNotes} className="card p-6 space-y-3">
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

        <div className="space-y-6">
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
