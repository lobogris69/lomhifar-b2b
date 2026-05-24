'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { submitApplication, type ApplyState } from './actions';

const initial: ApplyState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Enviando…' : 'Enviar solicitud'}
    </button>
  );
}

export function ApplicationForm({
  initialCif,
  initialEmail,
}: {
  initialCif?: string;
  initialEmail?: string;
}) {
  const [state, action] = useFormState(submitApplication, initial);

  function defaultValue(name: string, fallback?: string) {
    if (state.values && state.values[name] !== undefined) return state.values[name];
    return fallback ?? '';
  }

  return (
    <form action={action} className="space-y-6">
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink-900 mb-2">
          Datos fiscales y de contacto
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            name="cif"
            label="CIF / NIF"
            required
            placeholder="B12345678"
            defaultValue={defaultValue('cif', initialCif)}
            error={state.fieldErrors?.cif}
            uppercase
          />
          <Field
            name="email"
            label="Email"
            type="email"
            required
            placeholder="contacto@farmacia.com"
            defaultValue={defaultValue('email', initialEmail)}
            error={state.fieldErrors?.email}
          />
          <Field
            name="pharmacyName"
            label="Nombre de la farmacia"
            required
            placeholder="Farmacia García López"
            defaultValue={defaultValue('pharmacyName')}
            error={state.fieldErrors?.pharmacyName}
            className="sm:col-span-2"
          />
          <Field
            name="contactName"
            label="Persona de contacto"
            required
            defaultValue={defaultValue('contactName')}
            error={state.fieldErrors?.contactName}
          />
          <Field
            name="phone"
            label="Teléfono"
            required
            placeholder="911 234 567"
            defaultValue={defaultValue('phone')}
            error={state.fieldErrors?.phone}
          />
          <Field
            name="whatsapp"
            label="WhatsApp"
            hint="Opcional · si lo facilita le contactaremos por aquí"
            placeholder="+34 666 123 456"
            defaultValue={defaultValue('whatsapp')}
            error={state.fieldErrors?.whatsapp}
            className="sm:col-span-2"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink-900 mb-2">Dirección</legend>
        <div className="grid sm:grid-cols-6 gap-4">
          <Field
            name="address"
            label="Dirección"
            required
            defaultValue={defaultValue('address')}
            error={state.fieldErrors?.address}
            className="sm:col-span-6"
          />
          <Field
            name="city"
            label="Localidad"
            required
            defaultValue={defaultValue('city')}
            error={state.fieldErrors?.city}
            className="sm:col-span-3"
          />
          <Field
            name="postalCode"
            label="Código postal"
            required
            defaultValue={defaultValue('postalCode')}
            error={state.fieldErrors?.postalCode}
            className="sm:col-span-1"
          />
          <Field
            name="province"
            label="Provincia"
            required
            defaultValue={defaultValue('province')}
            error={state.fieldErrors?.province}
            className="sm:col-span-2"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink-900 mb-2">Datos bancarios</legend>
        <Field
          name="bankAccount"
          label="IBAN (cuenta bancaria)"
          required
          placeholder="ES00 0000 0000 0000 0000 0000"
          defaultValue={defaultValue('bankAccount')}
          error={state.fieldErrors?.bankAccount}
          hint="Necesario para girar la facturación. Solo cuentas españolas (ES…)."
          uppercase
          monospace
        />
      </fieldset>

      <div>
        <label className="label" htmlFor="message">
          Mensaje (opcional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="input"
          defaultValue={defaultValue('message')}
          placeholder="¿Algún comentario que debamos conocer?"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Submit />
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  placeholder,
  defaultValue,
  error,
  className,
  uppercase,
  monospace,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  className?: string;
  uppercase?: boolean;
  monospace?: boolean;
  hint?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`input ${uppercase ? 'uppercase tracking-wide' : ''} ${monospace ? 'font-mono' : ''}`}
      />
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
