'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { saveCustomer, type SaveCustomerState } from './actions';

const initial: SaveCustomerState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Guardando…' : 'Guardar cliente'}
    </button>
  );
}

export function CustomerForm({
  customer,
}: {
  customer?: {
    id: string;
    cif: string;
    email: string;
    pharmacyName: string;
    contactName: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    province: string | null;
    bankAccount: string | null;
    notes: string | null;
    active: boolean;
    isTest?: boolean;
  };
}) {
  const [state, action] = useFormState(saveCustomer, initial);
  return (
    <form action={action} className="space-y-6">
      {customer && <input type="hidden" name="id" value={customer.id} />}
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="CIF / NIF" name="cif" required defaultValue={customer?.cif} error={state.fieldErrors?.cif} uppercase />
        <Field label="Email" name="email" required type="email" defaultValue={customer?.email} error={state.fieldErrors?.email} />
        <Field label="Nombre de la farmacia" name="pharmacyName" required defaultValue={customer?.pharmacyName} error={state.fieldErrors?.pharmacyName} className="sm:col-span-2" />
        <Field label="Persona de contacto" name="contactName" defaultValue={customer?.contactName ?? ''} />
        <Field label="Teléfono" name="phone" defaultValue={customer?.phone ?? ''} />
        <Field label="WhatsApp" name="whatsapp" defaultValue={customer?.whatsapp ?? ''} />
        <Field label="IBAN" name="bankAccount" defaultValue={customer?.bankAccount ?? ''} uppercase />
        <Field label="Dirección" name="address" defaultValue={customer?.address ?? ''} className="sm:col-span-2" />
        <Field label="Localidad" name="city" defaultValue={customer?.city ?? ''} />
        <Field label="Código postal" name="postalCode" defaultValue={customer?.postalCode ?? ''} />
        <Field label="Provincia" name="province" defaultValue={customer?.province ?? ''} className="sm:col-span-2" />
      </div>

      <div>
        <label className="label" htmlFor="notes">Observaciones internas</label>
        <textarea id="notes" name="notes" rows={3} className="input" defaultValue={customer?.notes ?? ''} />
      </div>

      <label className="flex items-center gap-3">
        <input type="checkbox" name="active" defaultChecked={customer?.active ?? true} className="h-4 w-4" />
        <span className="text-sm">Cliente activo (puede acceder al portal)</span>
      </label>

      {/* Para poder recorrer la tienda entera antes de ensenarsela a nadie.
          Un pedido real NO se puede borrar —no hay boton en ninguna parte— y
          contaria en las estadisticas para siempre. Marcado como prueba, todo
          lo que pida esta farmacia se limpia despues de un boton. */}
      <label className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
        <input
          type="checkbox"
          name="isTest"
          defaultChecked={customer?.isTest ?? false}
          className="h-4 w-4 mt-0.5"
        />
        <span className="text-sm text-amber-900">
          <span className="font-semibold">Farmacia de prueba</span>
          <span className="block text-xs mt-0.5 leading-snug">
            Todo lo que pida se guarda como pedido de prueba: no cuenta en las
            estadísticas, no descuenta stock, y se borra de golpe desde
            Sistema → «Borrar pedidos de prueba». Úsalo para probar la tienda
            sin ensuciar las cifras del negocio.
          </span>
        </span>
      </label>

      <div className="flex justify-end gap-2">
        <a href="/admin/clientes" className="btn-secondary">Cancelar</a>
        <Submit />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  error,
  className,
  uppercase,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
  className?: string;
  uppercase?: boolean;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={`input ${uppercase ? 'uppercase tracking-wide' : ''}`}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
