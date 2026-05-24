'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { requestAccessCode, type AccessFormState } from './actions';
import { Alert } from '@/components/ui/Alert';
import { Loader2 } from 'lucide-react';

const initialState: AccessFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Verificando…' : 'Enviarme código de acceso'}
    </button>
  );
}

export function AccessForm() {
  const [state, formAction] = useFormState(requestAccessCode, initialState);

  if (state.notFound) {
    return (
      <Alert variant="warning" title="No encontramos su farmacia en nuestros registros">
        <p className="mb-3">
          El CIF/NIF <strong>{state.cif}</strong> con el email{' '}
          <strong>{state.email}</strong> no coincide con ningún cliente activo.
        </p>
        <p className="mb-4">
          Si su farmacia aún no trabaja con Lomhifar, puede solicitar el alta.
        </p>
        <div className="flex gap-2">
          <Link
            href={`/solicitud?cif=${encodeURIComponent(state.cif ?? '')}&email=${encodeURIComponent(state.email ?? '')}`}
            className="btn-primary"
          >
            Solicitar alta de farmacia
          </Link>
          <Link href="/acceso" className="btn-secondary">
            Probar otros datos
          </Link>
        </div>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <div>
        <label className="label" htmlFor="cif">
          CIF / NIF de la farmacia
        </label>
        <input
          id="cif"
          name="cif"
          type="text"
          autoComplete="off"
          autoFocus
          required
          placeholder="Ej. B12345678"
          defaultValue={state.cif}
          className="input uppercase tracking-wide"
        />
        {state.fieldErrors?.cif && <p className="field-error">{state.fieldErrors.cif}</p>}
        <p className="mt-1.5 text-xs text-ink-500">
          Documento fiscal español: <strong>CIF</strong> (empresas), <strong>NIF</strong> (autónomos) o <strong>NIE</strong>.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email registrado
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="contacto@farmacia.com"
          defaultValue={state.email}
          className="input"
        />
        {state.fieldErrors?.email && (
          <p className="field-error">{state.fieldErrors.email}</p>
        )}
        <p className="mt-2 text-xs text-ink-500">
          Le enviaremos un código de 6 dígitos a este email.
        </p>
      </div>

      <SubmitButton />

      <div className="text-center text-xs text-ink-500 pt-2">
        ¿Aún no es cliente?{' '}
        <Link href="/solicitud" className="text-brand-700 font-medium hover:underline">
          Solicitar alta de farmacia
        </Link>
      </div>
    </form>
  );
}
