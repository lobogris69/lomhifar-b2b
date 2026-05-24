'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useMemo, useState } from 'react';
import { Check, ShoppingCart, Loader2 } from 'lucide-react';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { Alert } from '@/components/ui/Alert';
import { addBraceletToCart, type AddState } from './actions';
import { cn, formatEuros } from '@/lib/utils';

interface Props {
  priceBlackCents: number;
  priceRedCents: number;
  maxCharsPerLine: number;
  deliveryDays: number;
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

export function Configurator({ priceBlackCents, priceRedCents, maxCharsPerLine, deliveryDays }: Props) {
  const [color, setColor] = useState<'BLACK' | 'RED'>('BLACK');
  const [quantity, setQuantity] = useState<number>(10);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [state, action] = useFormState(addBraceletToCart, initial);

  const unitPrice = color === 'BLACK' ? priceBlackCents : priceRedCents;
  const lineTotal = unitPrice * quantity;

  const canSubmit = useMemo(
    () => confirmed && line1.trim().length > 0 && quantity >= 1,
    [confirmed, line1, quantity],
  );

  function handleLineChange(setter: (s: string) => void, value: string) {
    // Normalizar: solo caracteres permitidos para grabado (sin saltos de línea), recortar
    const cleaned = value.replace(/\s+/g, ' ').slice(0, maxCharsPerLine);
    setter(cleaned);
    if (confirmed) setConfirmed(false);
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8 relative">
      {/* MÓVIL: preview sticky en la parte superior siempre visible mientras se escribe */}
      <div className="lg:hidden sticky top-[88px] z-20 -mx-4 sm:-mx-6 mb-2">
        <div className="bg-white border-y border-ink-100 shadow-card px-4 py-3">
          <BraceletPreview color={color} line1={line1.toUpperCase()} line2={line2.toUpperCase()} size="sm" />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-ink-500">
              {formatEuros(unitPrice)} × {quantity} ud
            </span>
            <span className="text-base font-semibold text-brand-800">
              {formatEuros(lineTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* DESKTOP: preview lateral sticky */}
      <div className="hidden lg:block lg:col-span-2">
        <div className="sticky top-32">
          <BraceletPreview color={color} line1={line1.toUpperCase()} line2={line2.toUpperCase()} />
          <div className="mt-4 card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Precio unitario</span>
              <span className="font-semibold text-ink-900">{formatEuros(unitPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-ink-500">Plazo estimado</span>
              <span className="font-medium text-ink-900">{deliveryDays} días laborables</span>
            </div>
            <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between">
              <span className="text-ink-500 text-sm">Total de esta línea</span>
              <span className="text-lg font-semibold text-brand-800">{formatEuros(lineTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configurador */}
      <form action={action} className="lg:col-span-3 space-y-6">
        {state.error && <Alert variant="danger">{state.error}</Alert>}

        {/* Color */}
        <section className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">1. Color de la pulsera</h3>
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
          <h3 className="text-sm font-semibold text-ink-900 mb-3">2. Unidades</h3>
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

        {/* Grabado */}
        <section className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">3. Texto grabado</h3>
          <div className="space-y-4">
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
            <div>
              <label className="label flex items-center justify-between" htmlFor="line2">
                <span>Línea 2 (opcional)</span>
                <span className="text-xs font-normal text-ink-400">
                  {line2.length}/{maxCharsPerLine}
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
            <p className="text-xs text-ink-500">
              La placa real mide <strong>4 × 1 cm</strong>. Máximo {maxCharsPerLine} caracteres
              por línea para garantizar legibilidad del grabado.
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
          <h3 className="text-sm font-semibold text-ink-900 mb-3">4. Confirmación</h3>
          <div className="rounded-lg bg-white border border-ink-100 p-4 mb-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Summary label="Color" value={color === 'BLACK' ? 'Negra' : 'Roja'} />
              <Summary label="Unidades" value={String(quantity)} />
              <Summary label="Total línea" value={formatEuros(lineTotal)} />
              <Summary label="Línea 1" value={line1.toUpperCase() || '—'} className="col-span-3" />
              <Summary label="Línea 2" value={line2.toUpperCase() || '—'} className="col-span-3" />
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
              <strong>Confirmo</strong> que el color, las unidades y el texto grabado son
              correctos. Entiendo que las pulseras se fabricarán exactamente con estos datos.
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
