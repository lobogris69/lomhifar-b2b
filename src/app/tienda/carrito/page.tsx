import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { ShoppingBag, Trash2, ChevronRight, ArrowLeft, Plus } from 'lucide-react';
import { readCart } from '@/lib/cart';
import { priceCart } from '@/lib/pricing';
import { formatEuros } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { CheckoutForm } from './CheckoutForm';
import { removeItemAction, updateQtyAction, clearCartAction } from './actions';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { BraceletPhoto } from '@/components/shop/BraceletPhoto';
import { getSettings, SETTING_KEYS, parsePrintArea } from '@/lib/settings';
import { getAllSiteTexts } from '@/lib/site-texts';
import { getSiteImageMeta } from '@/lib/site-images';

export const metadata = { title: 'Carrito · Lomhifar' };

export default async function CartPage({
  searchParams,
}: {
  searchParams: { added?: string; reordered?: string; parcial?: string; de?: string };
}) {
  const cart = readCart();
  const [{ items, totals }, settings, t, photoBlackMeta, photoRedMeta] = await Promise.all([
    priceCart(cart),
    getSettings(),
    getAllSiteTexts(),
    getSiteImageMeta('configurator-bracelet-black'),
    getSiteImageMeta('configurator-bracelet-red'),
  ]);
  const deliveryDays = settings[SETTING_KEYS.DELIVERY_DAYS];

  // Si el admin ha subido foto real de cada pulsera la usamos también aquí,
  // para que el carrito muestre la pulsera EN COLOR CORRECTO y con el grabado
  // sobre la placa real (igual que en el configurador).
  const photoBlackUrl = photoBlackMeta.isCustom && photoBlackMeta.hasImage
    ? `/api/images/configurator-bracelet-black?v=${photoBlackMeta.updatedAt?.getTime() ?? 0}`
    : null;
  const photoRedUrl = photoRedMeta.isCustom && photoRedMeta.hasImage
    ? `/api/images/configurator-bracelet-red?v=${photoRedMeta.updatedAt?.getTime() ?? 0}`
    : null;
  const areaBlack = parsePrintArea(settings[SETTING_KEYS.CONFIGURATOR_AREA_BLACK]);
  const areaRed = parsePrintArea(settings[SETTING_KEYS.CONFIGURATOR_AREA_RED]);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-500 mb-3">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="section-title">Su carrito está vacío</h1>
        <p className="section-subtitle">Configure una pulsera para empezar.</p>
        <Link href="/tienda" className="btn-primary mt-6 inline-flex">
          Ir al configurador <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Clave de idempotencia única por carga del carrito: viaja en el formulario
  // y evita que un doble envío / reintento de red cree pedidos duplicados.
  const idemKey = randomUUID();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Botón "Seguir comprando" siempre visible arriba */}
      <Link
        href="/tienda"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700 transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Seguir comprando — añadir más pulseras
      </Link>

      {searchParams.added && (
        <Alert variant="success" className="mb-6">
          Pulsera añadida al carrito. Revise los datos antes de confirmar el pedido.
        </Alert>
      )}
      {searchParams.reordered && !searchParams.parcial && (
        <Alert variant="success" className="mb-6">
          Hemos añadido al carrito todas las pulseras de su pedido anterior. Puede modificar
          cantidades o texto antes de confirmar.
        </Alert>
      )}
      {searchParams.parcial && (
        <Alert variant="warning" className="mb-6">
          Hemos añadido {searchParams.parcial} de las {searchParams.de} líneas de su pedido
          anterior: el carrito no admite más. Confirme este pedido y repita la operación para
          añadir el resto.
        </Alert>
      )}

      <div className="mb-6">
        <h1 className="section-title">{t['carrito.titulo']}</h1>
        <p className="section-subtitle">{t['carrito.descripcion']}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4 min-w-0">
          {items.map((it, idx) => {
            const cartItem = cart[idx];
            const isBlack = it.color === 'BLACK';
            const photoUrl = isBlack ? photoBlackUrl : photoRedUrl;
            const area = isBlack ? areaBlack : areaRed;
            return (
              <div key={cartItem.id} className="card p-5">
                <div className="grid sm:grid-cols-5 gap-5">
                  <div className="sm:col-span-2">
                    {photoUrl ? (
                      <BraceletPhoto
                        imageUrl={photoUrl}
                        area={area}
                        line1={it.line1}
                        line2={it.line2}
                        line3={it.line3}
                        alt={`Pulsera ${isBlack ? 'negra' : 'roja'} Lomhifar`}
                      />
                    ) : (
                      <BraceletPreview
                        color={it.color}
                        line1={it.line1}
                        line2={it.line2}
                      />
                    )}
                  </div>
                  <div className="sm:col-span-3 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* Punto del color para que se identifique al instante */}
                        <span
                          className={`inline-block h-4 w-4 rounded-full border border-ink-200 ${isBlack ? 'bg-ink-950' : 'bg-red-600'}`}
                          aria-hidden
                        />
                        <div>
                          <div className="text-xs uppercase tracking-wider text-ink-400">
                            Pulsera {isBlack ? 'negra' : 'roja'}
                          </div>
                          <div className="mt-0.5 font-semibold text-ink-900 text-lg">
                            {formatEuros(it.unitPriceCents)} <span className="text-sm font-normal text-ink-500">/ ud</span>
                          </div>
                        </div>
                      </div>
                      <form action={removeItemAction}>
                        <input type="hidden" name="id" value={cartItem.id} />
                        <button
                          type="submit"
                          className="btn-ghost text-ink-500 hover:text-danger"
                          title="Quitar del carrito"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>

                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-ink-400">Línea 1</dt>
                        <dd className="font-mono font-medium text-ink-900 break-words">
                          {it.line1}
                        </dd>
                      </div>
                      {it.line2 && (
                        <div>
                          <dt className="text-[11px] uppercase tracking-wider text-ink-400">Línea 2</dt>
                          <dd className="font-mono font-medium text-ink-900 break-words">
                            {it.line2}
                          </dd>
                        </div>
                      )}
                      {it.line3 && (
                        <div>
                          <dt className="text-[11px] uppercase tracking-wider text-ink-400">Línea 3</dt>
                          <dd className="font-mono font-medium text-ink-900 break-words">
                            {it.line3}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-auto pt-4 flex items-end justify-between gap-3 flex-wrap">
                      <form action={updateQtyAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={cartItem.id} />
                        <label className="text-xs text-ink-500" htmlFor={`qty-${cartItem.id}`}>
                          Unidades
                        </label>
                        <input
                          id={`qty-${cartItem.id}`}
                          name="quantity"
                          type="number"
                          min={1}
                          max={9999}
                          defaultValue={it.quantity}
                          className="input w-24 text-center"
                        />
                        <button type="submit" className="btn-secondary text-xs">
                          Actualizar
                        </button>
                      </form>
                      <div className="text-right">
                        <div className="text-xs text-ink-500">Subtotal línea</div>
                        <div className="text-lg font-semibold text-brand-800">
                          {formatEuros(it.lineTotalCents)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CTA "Añadir otra pulsera" + Vaciar carrito */}
          <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
            <Link href="/tienda" className="btn-secondary text-sm">
              <Plus className="h-4 w-4" /> Añadir otra pulsera
            </Link>
            <form action={clearCartAction}>
              <button type="submit" className="btn-ghost text-ink-500 hover:text-danger text-xs">
                Vaciar carrito
              </button>
            </form>
          </div>
        </div>

        <aside className="lg:col-span-1 min-w-0">
          <div className="card p-6 sticky top-32 space-y-4">
            <h2 className="text-base font-semibold text-ink-900">Resumen del pedido</h2>
            <dl className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Subtotal ({totals.totalUnits} uds)</dt>
                <dd className="font-medium text-ink-900">{formatEuros(totals.subtotalCents)}</dd>
              </div>

              {/* Descuento por volumen — destacado en verde */}
              {totals.discountTier && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 -mx-1">
                  <dt className="text-emerald-800 font-semibold text-xs">
                    🎉 Descuento {totals.discountTier.discountPct}% por {totals.totalUnits} uds
                  </dt>
                  <dd className="font-bold text-emerald-700">
                    −{formatEuros(totals.discountCents)}
                  </dd>
                </div>
              )}

              {/* Portes — solo en modo "separate" */}
              {totals.shippingMode === 'separate' && (
                <>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">Portes</dt>
                    <dd className="font-medium text-ink-900">
                      {totals.shippingCents === 0 ? (
                        <span className="text-brand-700">Gratis</span>
                      ) : (
                        formatEuros(totals.shippingCents)
                      )}
                    </dd>
                  </div>
                  {totals.freeShippingThresholdCents > 0 &&
                    totals.subtotalCents < totals.freeShippingThresholdCents && (
                      <p className="text-xs text-ink-500 leading-relaxed">
                        Le faltan {formatEuros(totals.freeShippingThresholdCents - totals.subtotalCents)}{' '}
                        para portes gratis.
                      </p>
                    )}
                </>
              )}

              {/* Base imponible (informativo, sirve de separador antes de los impuestos) */}
              <div className="flex items-center justify-between border-t border-ink-100 pt-2">
                <dt className="text-ink-500 text-xs">Base imponible</dt>
                <dd className="text-ink-700 text-xs">{formatEuros(totals.taxableBaseCents)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500 text-xs">IVA ({totals.vatPct}%)</dt>
                <dd className="text-ink-700 text-xs">{formatEuros(totals.vatCents)}</dd>
              </div>
              {totals.equivSurchargeEnabled && (
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500 text-xs">
                    Recargo equivalencia ({totals.equivSurchargePct}%)
                  </dt>
                  <dd className="text-ink-700 text-xs">{formatEuros(totals.equivSurchargeCents)}</dd>
                </div>
              )}

              <div className="border-t-2 border-ink-200 pt-3 flex items-center justify-between">
                <dt className="font-semibold text-ink-900">TOTAL</dt>
                <dd className="text-2xl font-bold text-brand-800">
                  {formatEuros(totals.totalCents)}
                </dd>
              </div>
              {totals.shippingMode === 'included' && (
                <p className="text-[11px] text-ink-500 text-right italic">
                  Portes incluidos en el precio
                </p>
              )}
            </dl>

            <div className="text-xs text-ink-500">Plazo estimado: {deliveryDays} días laborables</div>

            {!totals.meetsMinimum && (
              <Alert variant="warning">
                Pedido mínimo: {formatEuros(totals.minimumCents)}. Añada más unidades para continuar.
              </Alert>
            )}

            <CheckoutForm
              canSubmit={totals.meetsMinimum}
              ctaLabel={t['carrito.cta']}
              confirmLabel={t['carrito.checkbox']}
              idemKey={idemKey}
            />

            <Link
              href="/tienda"
              className="block text-center text-xs text-ink-500 hover:text-brand-700 transition-colors pt-1"
            >
              ← Seguir comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
