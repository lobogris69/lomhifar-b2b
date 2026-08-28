import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate, formatEuros } from '@/lib/utils';
import { colorLabel } from '@/lib/cart';
import { OrderStatusBadge, ORDER_STATUS_LABEL } from '@/components/shop/OrderStatusBadge';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { IndicadorGrabadora } from '@/components/laser/IndicadorGrabadora';
import { AvisoDePedal } from '@/components/laser/AvisoDePedal';
import { BotonReferencia } from '@/components/laser/BotonReferencia';
import { EnviarAGrabadora } from './EnviarAGrabadora';
import { PrintButton } from '@/components/admin/PrintButton';
import { OrderProgress } from '@/components/admin/OrderProgress';
import { CARRIERS, DEFAULT_CARRIER } from '@/lib/shipping';
import { isMondialRelayEnabled } from '@/lib/mondial-relay';
import { saveAdminNotes, saveTracking, updateOrderStatus, markAsEngraved, unmarkEngraved } from '../actions';
import { Truck, ExternalLink, Zap, Download, Check, RotateCcw } from 'lucide-react';
import { GenerateMondialRelayLabel } from './GenerateMondialRelayLabel';
import { extractUniqueEngravings, slugForFilename } from '@/lib/laser';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pedido · Admin Lomhifar' };

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const [order, mrEnabled, enviados] = await Promise.all([
    prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, customer: true },
    }),
    isMondialRelayEnabled(),
    // En qué estado está cada grabado de este pedido dentro de la grabadora.
    // Sin esto, un grabado que salió de la cola por intentos fallidos no se
    // distinguía de uno que nunca se mandó.
    prisma.laserFile.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: 'desc' },
      select: {
        linesJoined: true, color: true,
        queuedAt: true, takenAt: true, engravedAt: true, intentos: true,
      },
    }),
  ]);
  if (!order) notFound();

  /** El envío más reciente de un grabado concreto, si lo hubo. */
  const estadoDelGrabado = (lineas: string[], color: string) =>
    enviados.find((e) => e.linesJoined === lineas.join(' · ') && e.color === color);

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

      {/* Barra de progreso lineal del pedido */}
      <div className="mb-6 no-print">
        <OrderProgress
          status={order.status}
          engravedAt={order.engravedAt}
          trackingNumber={order.trackingNumber}
        />
      </div>

      {/* Lo mismo que en llaveros: si la máquina espera, que se vea. */}
      <div className="mb-6">
        <AvisoDePedal />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-ink-900">Pulseras a fabricar</h2>
              {/* Cómo está la máquina del taller, sin tener que ir a mirarla. */}
              <IndicadorGrabadora />
            </div>


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
          {/* PASO 2 · GRABAR — Archivos DXF para EZCAD */}
          <div className="card p-6 no-print border-t-2 border-brand-500">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-[11px] font-bold">2</span>
              <Zap className="h-4 w-4 text-brand-700" />
              <h3 className="text-sm font-semibold text-ink-900">Grabar la pulsera</h3>
            </div>
            <div className="mb-3" />
            {(() => {
              const engravings = extractUniqueEngravings(order.items);
              if (engravings.length === 0) {
                return (
                  <p className="text-xs text-ink-500">
                    Este pedido no tiene texto para grabar.
                  </p>
                );
              }
              return (
                <>
                  {/* Explicaba el método viejo de EZCAD, y encima daba a
                      entender que el láser dispara al pulsar una tecla. */}
                  <p className="text-xs text-ink-500 mb-4">
                    Este pedido tiene <strong>{engravings.length}</strong>{' '}
                    {engravings.length === 1 ? 'texto único' : 'textos únicos'} para grabar.
                    Pulsa <strong>«Enviar a la grabadora»</strong> en cada uno: el trabajo viaja
                    solo al PC del taller y la máquina lo deja preparado.{' '}
                    <strong>No graba hasta que pisas el pedal</strong>, y graba tantas pulseras
                    como unidades pedidas.
                  </p>
                  {/* El puntero, junto a los ficheros que se van a grabar. */}
                  <div className="rounded-lg bg-ink-50/60 border border-ink-100 p-2 mb-3">
                    <BotonReferencia referencia="pulsera" etiqueta="Recuadro de la placa" />
                  </div>

                  <div className="space-y-3">
                    {engravings.map((e, idx) => {
                      const linePreview = e.lines.join(' · ');
                      const previewUrl = `/api/admin/pedidos/${order.id}/laser?line=${idx}&format=svg&inline=1`;
                      const dxfUrl = `/api/admin/pedidos/${order.id}/laser?line=${idx}`;
                      return (
                        <div
                          key={e.key}
                          className="rounded-lg border border-ink-200 bg-white overflow-hidden"
                        >
                          {/* Se apila SIEMPRE. No usar cortes tipo sm:/lg: aquí: se
                              miden contra el ancho de la VENTANA, no contra el de
                              esta columna, que en pantalla ancha se queda en ~300px.
                              Con la miniatura fijada a 220px, al botón «Descargar
                              DXF» le quedaban 60px y desaparecía justo en pantalla
                              completa, que es cuando más se usa. */}
                          <div className="p-3 flex flex-col gap-3">
                            <div
                              className={`w-full rounded border flex items-center justify-center p-1 min-h-[70px] ${
                                e.color === 'RED'
                                  ? 'border-[#3a0509] bg-[#8e1520]'
                                  : 'border-black bg-[#17171a]'
                              }`}
                            >
                              {/* Preview SVG del texto sobre la placa, ya con
                                  la correa de su color. El marco acompaña al
                                  mismo color: de un vistazo se ve cuál coger. */}
                              <object
                                type="image/svg+xml"
                                data={previewUrl}
                                className="w-full h-auto max-h-[80px] pointer-events-none"
                                aria-label={`Preview grabado ${idx + 1}`}
                              >
                                <span className="text-[10px] text-ink-400">Preview</span>
                              </object>
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500">
                                <span>Grabado {idx + 1}</span>
                                <span>·</span>
                                {/* El color, con su color: leerlo en gris entre
                                    el resto del texto es justo lo que lleva a
                                    coger la pulsera equivocada. */}
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-bold text-white ${
                                    e.color === 'RED' ? 'bg-[#8e1520]' : 'bg-[#17171a]'
                                  }`}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                                  {e.color === 'RED' ? 'Pulsera roja' : 'Pulsera negra'}
                                </span>
                                <span>·</span>
                                <span>{e.totalUnits} ud{e.totalUnits === 1 ? '' : 's'}</span>
                              </div>
                              <div className="mt-0.5 text-sm font-semibold text-ink-900 break-words">
                                {e.lines.map((l, i) => (
                                  <div key={i} className="font-mono text-[13px]">{l}</div>
                                ))}
                              </div>
                              <div className="mt-2 flex flex-wrap items-start gap-2">
                                {/* Lo habitual: va solo a la máquina y allí
                                    espera al pedal. La descarga manual se
                                    queda como alternativa. */}
                                <EnviarAGrabadora
                                  orderId={order.id}
                                  lineIndex={idx}
                                  enCola={(() => {
                                    const st = estadoDelGrabado(e.lines, e.color);
                                    return Boolean(st?.queuedAt && !st.engravedAt);
                                  })()}
                                  intentosFallidos={(() => {
                                    const st = estadoDelGrabado(e.lines, e.color);
                                    return st && !st.queuedAt && !st.engravedAt
                                      ? st.intentos
                                      : 0;
                                  })()}
                                />
                                <a
                                  href={dxfUrl}
                                  className="btn-secondary text-xs"
                                  download
                                >
                                  <Download className="h-3.5 w-3.5" /> Descargar DXF
                                </a>
                                <a
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-ghost text-xs"
                                >
                                  <ExternalLink className="h-3 w-3" /> Ver preview
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[11px] text-ink-400">
                    El nombre del archivo se genera automáticamente:{' '}
                    <code className="bg-ink-100 px-1 rounded text-[10px]">
                      YYYY-MM-DD_Pedido-{order.number}_{slugForFilename(order.pharmacyName, 12)}_L1_...dxf
                    </code>
                    . La configuración del área imprimible se edita en{' '}
                    <Link href="/admin/laser" className="underline">Grabado láser</Link>.
                  </p>

                  {/* Confirmación de grabado → salta al paso de envío */}
                  <div className="mt-4 pt-4 border-t border-ink-100">
                    {order.engravedAt ? (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <Check className="h-4 w-4" />
                          <span>
                            <strong>Grabado hecho</strong> el {formatDate(order.engravedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href="#paso-envio" className="btn-primary text-xs">
                            <Truck className="h-3.5 w-3.5" /> Ir al envío
                          </a>
                          <form action={unmarkEngraved}>
                            <input type="hidden" name="id" value={order.id} />
                            <button type="submit" className="btn-ghost text-xs text-ink-400" title="Deshacer marcado de grabado">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : (
                      <form action={markAsEngraved}>
                        <input type="hidden" name="id" value={order.id} />
                        <button type="submit" className="btn bg-emerald-600 hover:bg-emerald-700 text-white w-full py-2.5 text-sm">
                          <Check className="h-4 w-4" /> Ya lo he grabado → pasar a envío
                        </button>
                        <p className="mt-1.5 text-[11px] text-ink-400 text-center">
                          Marca el pedido como grabado (En preparación) y te lleva al paso de envío.
                        </p>
                      </form>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* PASO 3 · ENVIAR */}
          <div id="paso-envio" className="scroll-mt-6" />

          {/* Generación automática de etiqueta via API Mondial Relay */}
          {mrEnabled && !order.trackingNumber && order.postalCode && (
            <GenerateMondialRelayLabel orderId={order.id} destCP={order.postalCode} />
          )}

          <div className="card p-6 border-t-2 border-brand-500">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-[11px] font-bold">3</span>
              <Truck className="h-4 w-4 text-brand-700" />
              <h3 className="text-sm font-semibold text-ink-900">Enviar (tracking)</h3>
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

          {/* Cambio de estado MANUAL — secundario, para casos especiales
              (cancelar, poner en espera, marcar entregado/facturado a mano). */}
          <details className="card p-4">
            <summary className="text-sm font-semibold text-ink-900 cursor-pointer">
              Cambiar estado manualmente
            </summary>
            <p className="mt-2 text-[11px] text-ink-500">
              Normalmente no necesitas esto: los botones «Ya lo he grabado» y
              «Guardar tracking» ya cambian el estado solos. Úsalo para casos
              especiales: cancelar, poner en espera, marcar entregado o facturado.
            </p>
            <form action={updateOrderStatus} className="space-y-3 mt-3">
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
              <button type="submit" className="btn-secondary w-full">Actualizar estado</button>
            </form>
          </details>
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
