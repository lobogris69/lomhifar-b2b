'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
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

interface Props {
  initialValues: {
    priceBlackEuros: string;
    priceRedEuros: string;
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
  };
}

export function SettingsForm({ initialValues }: Props) {
  const [state, action] = useFormState(saveSettings, initial);

  return (
    <form action={action} className="space-y-8">
      {state.ok && <Alert variant="success">Configuración guardada correctamente.</Alert>}

      <Section title="Precios de pulseras">
        <div className="grid sm:grid-cols-2 gap-4">
          <Money label="Precio pulsera negra" name="priceBlackEuros" defaultValue={initialValues.priceBlackEuros} error={state.fieldErrors?.priceBlackCents} />
          <Money label="Precio pulsera roja" name="priceRedEuros" defaultValue={initialValues.priceRedEuros} error={state.fieldErrors?.priceRedCents} />
        </div>
      </Section>

      <Section title="Portes y pedido mínimo">
        <div className="grid sm:grid-cols-3 gap-4">
          <Money label="Portes (gastos de envío)" name="shippingEuros" defaultValue={initialValues.shippingEuros} error={state.fieldErrors?.shippingCents} />
          <Money label="Portes gratis a partir de" name="freeShippingThresholdEuros" defaultValue={initialValues.freeShippingThresholdEuros} error={state.fieldErrors?.freeShippingThresholdCents} />
          <Money label="Pedido mínimo" name="minOrderEuros" defaultValue={initialValues.minOrderEuros} error={state.fieldErrors?.minOrderCents} />
        </div>
      </Section>

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
