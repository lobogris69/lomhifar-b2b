'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Plus, X, Percent } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import type { ShippingMode, VolumeDiscountTier } from '@/lib/settings';
import { saveSettings, type SaveSettingsState } from './actions';

const initial: SaveSettingsState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Guardando…' : 'Guardar configuración'}
    </button>
  );
}

interface InpostInitial {
  webhookSecret: string;
  signatureMode: 'timestamp_body' | 'body_only';
  notifyCustomer: boolean;
  webhookUrl: string;
}

interface Props {
  inpost?: InpostInitial;
  initialValues: {
    priceBlackEuros: string;
    priceRedEuros: string;
    pvprEuros: string;
    shippingEuros: string;
    freeShippingThresholdEuros: string;
    minOrderEuros: string;
    minQuantityPerLine: string;
    deliveryDays: string;
    ordersRecipientEmails: string;
    maxCharsPerLine: string;
    companyName: string;
    companyPhone: string;
    companyEmail: string;
    shippingMode: ShippingMode;
    volumeDiscountTiers: VolumeDiscountTier[];
    vatPct: string;
    equivSurchargePct: string;
    equivSurchargeEnabled: boolean;
  };
}

export function SettingsForm({ initialValues, inpost }: Props) {
  const [state, action] = useFormState(saveSettings, initial);
  const [shippingMode, setShippingMode] = useState<ShippingMode>(initialValues.shippingMode);
  const [tiers, setTiers] = useState<VolumeDiscountTier[]>(
    initialValues.volumeDiscountTiers.length > 0
      ? initialValues.volumeDiscountTiers
      : [],
  );
  const [equivEnabled, setEquivEnabled] = useState<boolean>(initialValues.equivSurchargeEnabled);

  function addTier() {
    const lastQty = tiers.length > 0 ? tiers[tiers.length - 1].minQuantity : 10;
    setTiers([...tiers, { minQuantity: lastQty + 25, discountPct: 5 }]);
  }
  function removeTier(i: number) {
    setTiers(tiers.filter((_, idx) => idx !== i));
  }
  function updateTier(i: number, field: keyof VolumeDiscountTier, value: number) {
    const next = [...tiers];
    next[i] = { ...next[i], [field]: value };
    setTiers(next);
  }

  return (
    <form action={action} className="space-y-8">
      {state.ok && <Alert variant="success">Configuración guardada correctamente.</Alert>}

      <Section title="Precios de pulseras (coste para la farmacia)">
        <div className="grid sm:grid-cols-2 gap-4">
          <Money label="Precio pulsera negra" name="priceBlackEuros" defaultValue={initialValues.priceBlackEuros} error={state.fieldErrors?.priceBlackCents} />
          <Money label="Precio pulsera roja" name="priceRedEuros" defaultValue={initialValues.priceRedEuros} error={state.fieldErrors?.priceRedCents} />
        </div>
      </Section>

      <Section title="PVP recomendado al paciente">
        <p className="text-xs text-ink-500 -mt-2 mb-3">
          Precio sugerido al que la farmacia revende cada pulsera a su cliente final.
          Se muestra en la web pública y en el configurador para que la farmacia conozca su margen.
          Mismo precio para negra y roja.
        </p>
        <Money
          label="PVPR (precio venta al público recomendado)"
          name="pvprEuros"
          defaultValue={initialValues.pvprEuros}
          error={state.fieldErrors?.pvprCents}
        />
      </Section>

      <Section title="Portes y pedido mínimo">
        <div className="space-y-4">
          <div>
            <label className="label">Modo de portes</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-all ${shippingMode === 'included' ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20' : 'border-ink-200 bg-white hover:border-ink-300'}`}>
                <input
                  type="radio"
                  name="shippingMode"
                  value="included"
                  checked={shippingMode === 'included'}
                  onChange={() => setShippingMode('included')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-ink-900 text-sm">Portes incluidos en el precio</div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    No se cobra envío aparte. El cliente no ve línea de portes en el carrito.
                  </div>
                </div>
              </label>
              <label className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-all ${shippingMode === 'separate' ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20' : 'border-ink-200 bg-white hover:border-ink-300'}`}>
                <input
                  type="radio"
                  name="shippingMode"
                  value="separate"
                  checked={shippingMode === 'separate'}
                  onChange={() => setShippingMode('separate')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-ink-900 text-sm">Portes aparte</div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    Se suman al total. Posibilidad de portes gratis a partir de cierto importe.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {shippingMode === 'separate' && (
            <div className="grid sm:grid-cols-3 gap-4">
              <Money label="Portes (gastos de envío)" name="shippingEuros" defaultValue={initialValues.shippingEuros} error={state.fieldErrors?.shippingCents} />
              <Money label="Portes gratis a partir de" name="freeShippingThresholdEuros" defaultValue={initialValues.freeShippingThresholdEuros} error={state.fieldErrors?.freeShippingThresholdCents} />
              <Money label="Pedido mínimo" name="minOrderEuros" defaultValue={initialValues.minOrderEuros} error={state.fieldErrors?.minOrderCents} />
            </div>
          )}
          {shippingMode === 'included' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Mantenemos los campos ocultos por si se vuelve a modo 'separate' */}
              <input type="hidden" name="shippingEuros" value={initialValues.shippingEuros} />
              <input type="hidden" name="freeShippingThresholdEuros" value={initialValues.freeShippingThresholdEuros} />
              <Money label="Pedido mínimo" name="minOrderEuros" defaultValue={initialValues.minOrderEuros} error={state.fieldErrors?.minOrderCents} />
            </div>
          )}
        </div>
      </Section>

      <Section title="Descuentos por volumen">
        <p className="text-xs text-ink-500 -mt-2 mb-4 leading-relaxed">
          Aplican al subtotal del pedido cuando el cliente alcanza la cantidad mínima
          (suma de todas las líneas). Se muestran en vivo en el configurador (&laquo;Pide
          5 uds más y ahorra 10%&raquo;) y en el carrito.
        </p>

        {tiers.length === 0 && (
          <div className="text-xs text-ink-500 italic mb-3 px-3 py-2 bg-ink-50/50 rounded border border-dashed border-ink-200">
            No hay tramos de descuento configurados. Añade uno para activarlos.
          </div>
        )}

        <div className="space-y-2">
          {tiers.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-ink-200 bg-white">
              <span className="text-xs text-ink-500">A partir de</span>
              <input
                type="number"
                name="tierMinQty"
                value={t.minQuantity}
                min={1}
                max={9999}
                onChange={(e) => updateTier(i, 'minQuantity', Math.max(1, Number(e.target.value)))}
                className="input w-24 text-right text-sm"
              />
              <span className="text-xs text-ink-500">uds → descuento</span>
              <div className="relative">
                <input
                  type="number"
                  name="tierDiscountPct"
                  value={t.discountPct}
                  min={1}
                  max={50}
                  step={0.5}
                  onChange={(e) => updateTier(i, 'discountPct', Math.max(0, Math.min(50, Number(e.target.value))))}
                  className="input w-24 text-right text-sm pr-8"
                />
                <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
              </div>
              <button
                type="button"
                onClick={() => removeTier(i)}
                className="ml-auto btn-ghost text-ink-400 hover:text-danger"
                aria-label="Eliminar tramo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTier}
          className="btn-secondary text-xs mt-3"
        >
          <Plus className="h-3.5 w-3.5" /> Añadir tramo
        </button>
      </Section>

      <Section title="Impuestos (IVA y recargo de equivalencia)">
        <p className="text-xs text-ink-500 -mt-2 mb-4 leading-relaxed">
          El IVA y el recargo de equivalencia se calculan sobre la base imponible
          (subtotal − descuento + portes). En España las farmacias suelen estar bajo
          el régimen de recargo de equivalencia (21% IVA + 5,2% recargo). Si tu
          cliente no lo está, desactiva el recargo aquí abajo.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-3">
          <PercentField name="vatPct" label="IVA (%)" defaultValue={initialValues.vatPct} placeholder="21" />
          <PercentField
            name="equivSurchargePct"
            label="Recargo equivalencia (%)"
            defaultValue={initialValues.equivSurchargePct}
            placeholder="5.2"
            disabled={!equivEnabled}
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-lg bg-brand-50/40 border border-brand-100">
          <input
            type="checkbox"
            name="equivSurchargeEnabled"
            checked={equivEnabled}
            onChange={(e) => setEquivEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink-900">
              Aplicar recargo de equivalencia a TODOS los pedidos
            </div>
            <div className="text-xs text-ink-500 mt-0.5">
              Si está activo se suma el recargo al total. Para farmacias bajo este
              régimen (lo más común en España).
            </div>
          </div>
        </label>
      </Section>

      {inpost && (
        <Section title="Trazabilidad InPost (webhooks)">
          <p className="text-xs text-ink-500 -mt-2 mb-4 leading-relaxed">
            Conecta tu cuenta de InPost para recibir actualizaciones automáticas
            del estado del envío. Cuando InPost notifique &laquo;listo en el locker&raquo;,
            &laquo;recogido por el cliente&raquo; o cualquier incidencia, tu cliente recibirá
            un email automático con el detalle.
          </p>

          <div className="card p-4 bg-amber-50/40 border-amber-200 mb-4 text-xs space-y-2">
            <div className="font-semibold text-amber-900">📋 Cómo activarlo (3 pasos):</div>
            <ol className="list-decimal list-inside text-amber-900 space-y-1 ml-1 leading-relaxed">
              <li>Contacta con tu Account Manager de InPost (no hay self-service todavía).</li>
              <li>
                Dale esta URL de webhook:{' '}
                <code className="bg-white px-2 py-0.5 rounded border border-amber-200 font-mono text-[11px] break-all">
                  {inpost.webhookUrl}
                </code>
              </li>
              <li>
                Pídeles que firmen con HMAC-SHA256 y te den el SECRETO. Pégalo abajo y
                guarda. Listo.
              </li>
            </ol>
            <p className="text-amber-900/80 mt-2 italic">
              Doc oficial: <a href="https://developers.inpost-group.com/webhooks" target="_blank" rel="noopener noreferrer" className="underline">developers.inpost-group.com/webhooks</a>
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="inpostWebhookSecret">
                Secreto de firma webhook (HMAC-SHA256)
              </label>
              <input
                id="inpostWebhookSecret"
                name="inpostWebhookSecret"
                type="password"
                defaultValue={inpost.webhookSecret}
                placeholder="Pega aquí el secreto que te dé InPost…"
                className="input font-mono text-sm"
                autoComplete="off"
              />
              <p className="text-xs text-ink-500 mt-1">
                {inpost.webhookSecret
                  ? '✓ Hay un secreto guardado. Los webhooks están ACTIVOS y se valida la firma de cada petición.'
                  : '⚠ Sin secreto, los webhooks NO procesan eventos en producción (rechazo 401).'}
              </p>
            </div>

            <div>
              <label className="label" htmlFor="inpostSignatureMode">
                Modo de firma
              </label>
              <select
                id="inpostSignatureMode"
                name="inpostSignatureMode"
                defaultValue={inpost.signatureMode}
                className="input"
              >
                <option value="timestamp_body">Firma sobre timestamp + cuerpo (recomendado, anti-replay)</option>
                <option value="body_only">Firma solo sobre el cuerpo</option>
              </select>
              <p className="text-xs text-ink-500 mt-1">
                Pregunta a InPost qué modo configuraron. El más seguro es el primero.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-lg bg-emerald-50/40 border border-emerald-200">
              <input
                type="checkbox"
                name="shippingNotifyCustomer"
                defaultChecked={inpost.notifyCustomer}
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink-900">
                  Enviar emails automáticos al cliente con cada hito del envío
                </div>
                <div className="text-xs text-ink-500 mt-0.5 leading-relaxed">
                  Cuando llegue un evento de InPost (recogido, en tránsito, listo en locker,
                  recogido por cliente, incidencia, entregado…) el cliente recibirá un
                  email contextual con el botón &laquo;Ver seguimiento&raquo;. Es uno de los
                  detalles más valorados por las farmacias.
                </div>
              </div>
            </label>
          </div>
        </Section>
      )}

      <Section title="Plazo y unidades">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Plazo de entrega (días)" name="deliveryDays" type="number" defaultValue={initialValues.deliveryDays} error={state.fieldErrors?.deliveryDays} min={1} />
          <Field label="Unidades mínimas por línea" name="minQuantityPerLine" type="number" defaultValue={initialValues.minQuantityPerLine} error={state.fieldErrors?.minQuantityPerLine} min={1} />
          <Field label="Caracteres máximos por línea grabada" name="maxCharsPerLine" type="number" defaultValue={initialValues.maxCharsPerLine} error={state.fieldErrors?.maxCharsPerLine} min={5} max={60} />
        </div>
      </Section>

      <Section title="Recepción de pedidos">
        <Field
          label="Emails que recibirán los pedidos (separar por coma)"
          name="ordersRecipientEmails"
          defaultValue={initialValues.ordersRecipientEmails}
          error={state.fieldErrors?.ordersRecipientEmails}
        />
      </Section>

      <Section title="Datos de empresa (para emails)">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre comercial" name="companyName" defaultValue={initialValues.companyName} error={state.fieldErrors?.companyName} />
          <Field label="Email contacto público" name="companyEmail" type="email" defaultValue={initialValues.companyEmail} error={state.fieldErrors?.companyEmail} />
          <Field label="Teléfono" name="companyPhone" defaultValue={initialValues.companyPhone} className="sm:col-span-2" />
        </div>
      </Section>

      <div className="flex justify-end pt-4">
        <Submit />
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-6">
      <legend className="text-sm font-semibold text-ink-900 px-2 -ml-2 mb-3">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label, name, defaultValue, error, type = 'text', className, min, max,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  type?: string;
  className?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} min={min} max={max} className="input" />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function Money({ label, name, defaultValue, error }: { label: string; name: string; defaultValue?: string; error?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type="text"
          inputMode="decimal"
          pattern="\d+([.,]\d{1,2})?"
          defaultValue={defaultValue}
          className="input pr-9"
          placeholder="0,00"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">€</span>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function PercentField({ label, name, defaultValue, placeholder, disabled }: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <label className="label" htmlFor={name}>{label}</label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type="text"
          inputMode="decimal"
          pattern="\d+([.,]\d{1,2})?"
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          className="input pr-9"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">%</span>
      </div>
    </div>
  );
}
