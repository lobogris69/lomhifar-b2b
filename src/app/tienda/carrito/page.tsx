import Link from 'next/link';
import { ShoppingBag, Trash2, ChevronRight } from 'lucide-react';
import { readCart } from '@/lib/cart';
import { priceCart } from '@/lib/pricing';
import { formatEuros } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { CheckoutForm } from './CheckoutForm';
import { removeItemAction, updateQtyAction, clearCartAction } from './actions';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { getSettings, SETTING_KEYS } from '@/lib/settings';
import { getAllSiteTexts } from '@/lib/site-texts';

export const metadata = { title: 'Carrito · Lomhifar' };

export default async function CartPage({
  searchParams,
}: {
  searchParams: { added?: string; reordered?: string };
}) {
  const cart = readCart();
  const [{ items, totals }, settings, t] = await Promise.all([
    priceCart(cart),
    getSettings(),
    getAllSiteTexts(),
  ]);
  const deliveryDays = settings[SETTING_KEYS.DELIVERY_DAYS];

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

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {searchParams.added && (
        <Alert variant="success" className="mb-6">
          Pulsera añadida al carrito. Revise los datos antes de confirmar el pedido.
        </Alert>
      )}
      {searchParams.reordered && (
        <Alert variant="success" className="mb-6">
          Hemos añadido al carrito todas las pulseras de su pedido anterior. Puede modificar
          cantidades o texto antes de confirmar.
        </Alert>
      )}

      <div className="mb-6">
        <h1 className="section-title">{t['carrito.titulo']}</h1>
        <p className="section-subtitle">{t['carrito.descripcion']}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((it, idx) => {
            const cartItem = cart[idx];
            return (
              <div key={cartItem.id} className="card p-5">
                <div className="grid sm:grid-cols-5 gap-5">
                  <div className="sm:col-span-2">
                    <BraceletPreview
                      color={it.color}
                      line1={it.line1.toUpperCase()}
                      line2={it.line2.toUpperCase()}
                    />
                  </div>
                  <div className="sm:col-span-3 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-ink-400">
                          Pulsera {it.color === 'BLACK' ? 'negra' : 'roja'}
                        </div>
                        <div className="mt-1 font-semibold text-ink-900 text-lg">
                          {formatEuros(it.unitPriceCents)} <span className="text-sm font-normal text-ink-500">/ ud</span>
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

                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-ink-400">Línea 1</dt>
                        <dd className="font-mono font-medium text-ink-900 break-words">
                          {it.line1.toUpperCase()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-ink-400">Línea 2</dt>
                        <dd className="font-mono font-medium text-ink-900 break-words">
                          {it.line2 ? it.line2.toUpperCase() : <span className="text-ink-400">—</span>}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto pt-4 flex items-end justify-between gap-3">
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

          <form action={clearCartAction} className="text-right">
            <button type="submit" className="btn-ghost text-ink-500 hover:text-danger text-xs">
              Vaciar carrito
            </button>
          </form>
        </div>

        <aside className="lg:col-span-1">
          <div className="card p-6 sticky top-32 space-y-4">
            <h2 className="text-base font-semibold text-ink-900">Resumen</h2>
            <dl className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="font-medium text-ink-900">{formatEuros(totals.subtotalCents)}</dd>
              </div>
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
              <div className="border-t border-ink-100 pt-3 flex items-center justify-between">
                <dt className="font-semibold text-ink-900">Total</dt>
                <dd className="text-xl font-semibold text-brand-800">
                  {formatEuros(totals.totalCents)}
                </dd>
              </div>
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
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
