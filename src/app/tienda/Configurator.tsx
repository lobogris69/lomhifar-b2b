'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useMemo, useState } from 'react';
import { Check, ShoppingCart, Loader2, Plus, X } from 'lucide-react';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { BraceletPhoto } from '@/components/shop/BraceletPhoto';
import { Alert } from '@/components/ui/Alert';
import { addBraceletToCart, type AddState } from './actions';
import { cn, formatEuros } from '@/lib/utils';
import { findApplicableTier, findNextTier, type PrintArea, type VolumeDiscountTier } from '@/lib/settings';

interface Props {
  priceBlackCents: number;
  priceRedCents: number;
  /** PVPR conservado por compatibilidad; ya no se renderiza el bloque de margen */
  pvprCents: number;
  maxCharsPerLine: number;
  deliveryDays: number;
  /** URLs (o null) de las fotos reales y sus áreas de impresión */
  photoBlackUrl: string | null;
  photoRedUrl: string | null;
  areaBlack: PrintArea;
  areaRed: PrintArea;
  /** Tramos de descuento por volumen (vacío = sin descuentos) */
  volumeDiscountTiers: VolumeDiscountTier[];
  /** Si los portes ya van incluidos en el precio (default) o se cobran aparte */
  shippingIncluded: boolean;
  texts: {
    paso1: string;
    paso2: string;
    paso3: string;
    paso4: string;
    confirmacion: string;
    pvprEtiqueta: string;
    pvprMargenTexto: string;
  };
}

const initial: AddState = {};

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="btn-primary w-full text-base py-3"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
      {pending ? 'Añadiendo…' : 'Añadir al carrito'}
    </button>
  );
}

export function Configurator({
  priceBlackCents,
  priceRedCents,
  maxCharsPerLine,
  deliveryDays,
  photoBlackUrl,
  photoRedUrl,
  areaBlack,
  areaRed,
  volumeDiscountTiers,
  shippingIncluded,
  texts,
}: Props) {
  const [color, setColor] = useState<'BLACK' | 'RED'>('BLACK');
  const [quantity, setQuantity] = useState<number>(1);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [line3, setLine3] = useState('');
  const [showLine2, setShowLine2] = useState(false);
  const [showLine3, setShowLine3] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [state, action] = useFormState(addBraceletToCart, initial);

  const unitPrice = color === 'BLACK' ? priceBlackCents : priceRedCents;
  const lineTotal = unitPrice * quantity;

  // Descuento por volumen aplicable a esta línea (basado en uds de esta línea)
  const currentTier = findApplicableTier(quantity, volumeDiscountTiers);
  const nextTier = findNextTier(quantity, volumeDiscountTiers);
  const discountCents = currentTier
    ? Math.round((lineTotal * currentTier.discountPct) / 100)
    : 0;
  const lineTotalAfterDiscount = lineTotal - discountCents;

  // Hint del próximo tramo: cuánto se ahorraría al alcanzarlo
  let nextTierHint: { unitsToAdd: number; savingsCents: number } | null = null;
  if (nextTier) {
    const unitsToAdd = nextTier.minQuantity - quantity;
    const projectedSubtotal = unitPrice * nextTier.minQuantity;
    const projectedDiscount = Math.round((projectedSubtotal * nextTier.discountPct) / 100);
    nextTierHint = { unitsToAdd, savingsCents: projectedDiscount };
  }

  const currentPhotoUrl = color === 'BLACK' ? photoBlackUrl : photoRedUrl;
  const currentArea = color === 'BLACK' ? areaBlack : areaRed;

  const canSubmit = useMemo(
    () => confirmed && line1.trim().length > 0 && quantity >= 1,
    [confirmed, line1, quantity],
  );

  function handleLineChange(setter: (s: string) => void, value: string) {
    const cleaned = value.replace(/\s+/g, ' ').slice(0, maxCharsPerLine);
    setter(cleaned);
    if (confirmed) setConfirmed(false);
  }

  function addLine2() {
    setShowLine2(true);
  }
  function removeLine2() {
    setShowLine2(false);
    setLine2('');
    // Si quitamos la 2, también quitamos la 3 porque no tendría sentido
    if (showLine3) {
      setShowLine3(false);
      setLine3('');
    }
  }
  function addLine3() {
    setShowLine3(true);
  }
  function removeLine3() {
    setShowLine3(false);
    setLine3('');
  }

  // El usuario ve la línea 2 si la ha activado, y la 3 sólo si la 2 está activa
  const line2Visible = showLine2 || line2.length > 0;
  const line3Visible = (showLine3 || line3.length > 0) && line2Visible;
  // Texto que se renderiza en la pulsera (solo las líneas activas)
  const previewLine2 = line2Visible ? line2 : '';
  const previewLine3 = line3Visible ? line3 : '';

  return (
    <div className="grid lg:grid-cols-5 gap-8 relative">
      {/* MÓVIL: preview sticky en la parte superior siempre visible mientras se escribe */}
      <div className="lg:hidden sticky top-[88px] z-20 -mx-4 sm:-mx-6 mb-2">
        <div className="bg-white border-y border-ink-100 shadow-card px-4 py-3">
          {currentPhotoUrl ? (
            <div className="max-w-[280px] mx-auto">
              <BraceletPhoto
                imageUrl={currentPhotoUrl}
                area={currentArea}
                line1={line1}
                line2={previewLine2}
                line3={previewLine3}
                alt={`Pulsera ${color === 'BLACK' ? 'negra' : 'roja'} Lomhifar`}
              />
            </div>
          ) : (
            <BraceletPreview color={color} line1={line1.toUpperCase()} line2={previewLine2.toUpperCase()} size="sm" />
          )}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-ink-500">
              {formatEuros(unitPrice)} × {quantity} ud
            </span>
            {currentTier ? (
              <span className="flex items-baseline gap-1.5">
                <span className="line-through text-[11px] text-ink-400">{formatEuros(lineTotal)}</span>
                <span className="text-base font-bold text-brand-800">
                  {formatEuros(lineTotalAfterDiscount)}
                </span>
                <span className="text-[10px] font-bold text-emerald-700">
                  −{currentTier.discountPct}%
                </span>
              </span>
            ) : (
              <span className="text-base font-semibold text-brand-800">
                {formatEuros(lineTotal)}
              </span>
            )}
          </div>
          {nextTierHint && nextTierHint.unitsToAdd > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuantity(nextTier!.minQuantity);
                setConfirmed(false);
              }}
              className="mt-2 w-full rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] px-2 py-1.5 text-left hover:bg-amber-100 transition-colors"
            >
              🎯 <strong>Pide {nextTierHint.unitsToAdd} más</strong> → ahorra {nextTier!.discountPct}%
              ({formatEuros(nextTierHint.savingsCents)})
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP: preview lateral sticky */}
      <div className="hidden lg:block lg:col-span-2">
        <div className="sticky top-32 space-y-4">
          {currentPhotoUrl ? (
            <BraceletPhoto
              imageUrl={currentPhotoUrl}
              area={currentArea}
              line1={line1}
              line2={previewLine2}
              line3={previewLine3}
              alt={`Pulsera ${color === 'BLACK' ? 'negra' : 'roja'} Lomhifar`}
            />
          ) : (
            <BraceletPreview color={color} line1={line1.toUpperCase()} line2={previewLine2.toUpperCase()} />
          )}
          <div className="card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Precio unitario</span>
              <span className="font-semibold text-ink-900">{formatEuros(unitPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-ink-500">Plazo estimado</span>
              <span className="font-medium text-ink-900">{deliveryDays} días laborables</span>
            </div>
            <div className="mt-3 pt-3 border-t border-ink-100">
              {currentTier ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-500">Subtotal sin descuento</span>
                    <span className="line-through text-ink-400">{formatEuros(lineTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-emerald-700 font-semibold">
                      Descuento volumen −{currentTier.discountPct}%
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      −{formatEuros(discountCents)}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-ink-100 flex items-center justify-between">
                    <span className="text-ink-700 text-sm font-semibold">Total línea</span>
                    <span className="text-xl font-bold text-brand-800">
                      {formatEuros(lineTotalAfterDiscount)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-ink-500 text-sm">Total de esta línea</span>
                  <span className="text-lg font-semibold text-brand-800">{formatEuros(lineTotal)}</span>
                </div>
              )}
              {shippingIncluded && (
                <p className="mt-1 text-[11px] text-ink-500 italic text-right">
                  Portes incluidos
                </p>
              )}
            </div>
          </div>

          {/* Chip comercial: tramo alcanzado + invitación al siguiente */}
          {currentTier && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span className="text-emerald-800">
                <strong>¡Descuento {currentTier.discountPct}% aplicado!</strong>{' '}
                Ahorras {formatEuros(discountCents)}.
              </span>
            </div>
          )}
          {nextTierHint && nextTierHint.unitsToAdd > 0 && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-3 py-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-base shrink-0">🎯</span>
                <div>
                  <div className="text-amber-900 font-semibold">
                    Pide {nextTierHint.unitsToAdd} ud{nextTierHint.unitsToAdd === 1 ? '' : 's'} más
                    {' '}y ahorra el {nextTier!.discountPct}%
                  </div>
                  <div className="text-amber-700 mt-0.5">
                    Pasarías a pagar {formatEuros((unitPrice * nextTier!.minQuantity) - nextTierHint.savingsCents)}
                    {' '}por {nextTier!.minQuantity} uds (te ahorrarías {formatEuros(nextTierHint.savingsCents)}).
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity(nextTier!.minQuantity);
                      setConfirmed(false);
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-2.5 py-1 transition-colors"
                  >
                    Subir a {nextTier!.minQuantity} uds
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configurador */}
      <form action={action} className="lg:col-span-3 space-y-6">
        {state.error && <Alert variant="danger">{state.error}</Alert>}

        {/* Color */}
        <section className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">{texts.paso1}</h3>
          <div className="grid grid-cols-2 gap-3">
            <ColorOption
              label="Negra"
              active={color === 'BLACK'}
              onClick={() => setColor('BLACK')}
              swatch="bg-ink-950"
            />
            <ColorOption
              label="Roja"
              active={color === 'RED'}
              onClick={() => setColor('RED')}
              swatch="bg-red-700"
            />
          </div>
          <input type="hidden" name="color" value={color} />
        </section>

        {/* Unidades */}
        <section className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">{texts.paso2}</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setQuantity((q) => Math.max(1, q - 1));
                setConfirmed(false);
              }}
              className="btn-secondary px-3 py-2 text-lg"
              aria-label="Disminuir"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={9999}
              name="quantity"
              value={quantity}
              onChange={(e) => {
                const v = Math.max(1, Math.min(9999, Number(e.target.value) || 1));
                setQuantity(v);
                setConfirmed(false);
              }}
              className="input text-center w-28 text-lg font-semibold"
            />
            <button
              type="button"
              onClick={() => {
                setQuantity((q) => Math.min(9999, q + 1));
                setConfirmed(false);
              }}
              className="btn-secondary px-3 py-2 text-lg"
              aria-label="Aumentar"
            >
              +
            </button>
            <span className="text-sm text-ink-500 ml-2">pulseras con este mismo texto</span>
          </div>
          {state.fieldErrors?.quantity && <p className="field-error">{state.fieldErrors.quantity}</p>}
        </section>

        {/* Grabado: 1, 2 o 3 líneas a elección del cliente */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-ink-900">{texts.paso3}</h3>
            <span className="text-[11px] text-ink-500">
              Puede grabar hasta <strong>3 líneas</strong> sobre la placa
            </span>
          </div>
          <div className="space-y-4">
            {/* Línea 1 (obligatoria) */}
            <div>
              <label className="label flex items-center justify-between" htmlFor="line1">
                <span>Línea 1 <span className="text-danger">*</span></span>
                <span className="text-xs font-normal text-ink-400">
                  {line1.length}/{maxCharsPerLine}
                </span>
              </label>
              <input
                id="line1"
                name="line1"
                type="text"
                maxLength={maxCharsPerLine}
                required
                value={line1}
                onChange={(e) => handleLineChange(setLine1, e.target.value)}
                placeholder="Ej: DIABETES TIPO 1"
                className="input uppercase tracking-wide"
                autoComplete="off"
              />
              {state.fieldErrors?.line1 && <p className="field-error">{state.fieldErrors.line1}</p>}
            </div>

            {/* Línea 2 (opcional) — se muestra al pulsar + Añadir línea 2 */}
            {!line2Visible ? (
              <button
                type="button"
                onClick={addLine2}
                className="btn-secondary text-sm w-full justify-center"
              >
                <Plus className="h-4 w-4" /> Añadir línea 2 (opcional)
              </button>
            ) : (
              <div>
                <label className="label flex items-center justify-between" htmlFor="line2">
                  <span>Línea 2</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-normal text-ink-400">
                      {line2.length}/{maxCharsPerLine}
                    </span>
                    <button
                      type="button"
                      onClick={removeLine2}
                      className="text-[11px] text-ink-400 hover:text-danger inline-flex items-center gap-0.5"
                      title="Quitar esta línea"
                    >
                      <X className="h-3 w-3" /> quitar
                    </button>
                  </span>
                </label>
                <input
                  id="line2"
                  name="line2"
                  type="text"
                  maxLength={maxCharsPerLine}
                  value={line2}
                  onChange={(e) => handleLineChange(setLine2, e.target.value)}
                  placeholder="Ej: TFNO 666 123 456"
                  className="input uppercase tracking-wide"
                  autoComplete="off"
                />
                {state.fieldErrors?.line2 && <p className="field-error">{state.fieldErrors.line2}</p>}
              </div>
            )}

            {/* Línea 3 (opcional) — solo si hay línea 2 */}
            {line2Visible && !line3Visible && (
              <button
                type="button"
                onClick={addLine3}
                className="btn-secondary text-sm w-full justify-center"
              >
                <Plus className="h-4 w-4" /> Añadir línea 3 (opcional)
              </button>
            )}
            {line3Visible && (
              <div>
                <label className="label flex items-center justify-between" htmlFor="line3">
                  <span>Línea 3</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-normal text-ink-400">
                      {line3.length}/{maxCharsPerLine}
                    </span>
                    <button
                      type="button"
                      onClick={removeLine3}
                      className="text-[11px] text-ink-400 hover:text-danger inline-flex items-center gap-0.5"
                      title="Quitar esta línea"
                    >
                      <X className="h-3 w-3" /> quitar
                    </button>
                  </span>
                </label>
                <input
                  id="line3"
                  name="line3"
                  type="text"
                  maxLength={maxCharsPerLine}
                  value={line3}
                  onChange={(e) => handleLineChange(setLine3, e.target.value)}
                  placeholder="Ej: ICE +34 666 123 456"
                  className="input uppercase tracking-wide"
                  autoComplete="off"
                />
                {state.fieldErrors?.line3 && <p className="field-error">{state.fieldErrors.line3}</p>}
              </div>
            )}

            {/* Inputs ocultos para que el server reciba siempre line2/line3 */}
            {!line2Visible && <input type="hidden" name="line2" value="" />}
            {!line3Visible && <input type="hidden" name="line3" value="" />}

            <p className="text-xs text-ink-500">
              La placa real mide <strong>4 × 1 cm</strong>. Máximo {maxCharsPerLine} caracteres
              por línea. Cuantas más líneas, menor el tamaño de letra (siempre centrado).
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-xs text-ink-400 mr-1">Ejemplos:</span>
              {[
                'DIABETES TIPO 1',
                'ALÉRGICO',
                'EPILEPSIA',
                'ANTICOAGULADO',
                'ASMA',
                'MARCAPASOS',
                'ALZHEIMER',
                'HIPERTENSIÓN',
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => handleLineChange(setLine1, ex)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Confirmación */}
        <section className="card p-6 border-brand-200 bg-brand-50/40">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">{texts.paso4}</h3>
          <div className="rounded-lg bg-white border border-ink-100 p-4 mb-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Summary label="Color" value={color === 'BLACK' ? 'Negra' : 'Roja'} />
              <Summary label="Unidades" value={String(quantity)} />
              <Summary label="Total línea" value={formatEuros(lineTotal)} />
              <Summary label="Línea 1" value={line1.toUpperCase() || '—'} className="col-span-3" />
              {line2Visible && (
                <Summary label="Línea 2" value={line2.toUpperCase() || '—'} className="col-span-3" />
              )}
              {line3Visible && (
                <Summary label="Línea 3" value={line3.toUpperCase() || '—'} className="col-span-3" />
              )}
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="confirmed"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
              required
            />
            <span className="text-sm text-ink-800 leading-relaxed">
              {texts.confirmacion}
            </span>
          </label>
          {state.fieldErrors?.confirmed && (
            <p className="field-error">{state.fieldErrors.confirmed}</p>
          )}

          <div className="mt-4">
            <SubmitBtn disabled={!canSubmit} />
          </div>
        </section>
      </form>
    </div>
  );
}

function ColorOption({
  label,
  active,
  onClick,
  swatch,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  swatch: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all',
        active
          ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20'
          : 'border-ink-200 hover:border-ink-300 bg-white',
      )}
    >
      <span className={cn('h-8 w-8 rounded-full border border-ink-200 shadow-inner', swatch)} />
      <div>
        <div className="font-semibold text-ink-900 text-sm">{label}</div>
        <div className="text-xs text-ink-500">Pulsera Lomhifar</div>
      </div>
      {active && (
        <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-white">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}

function Summary({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[11px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className="font-medium text-ink-900 mt-0.5 break-words">{value}</div>
    </div>
  );
}
