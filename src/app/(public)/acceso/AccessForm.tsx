'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { requestAccessCode, type AccessFormState } from './actions';
import { Alert } from '@/components/ui/Alert';
import { Loader2, ArrowRight, FileText, Mail } from 'lucide-react';

const initialState: AccessFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full py-3 text-sm" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Verificando…' : 'Acceder'}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

export function AccessForm() {
  const [state, formAction] = useFormState(requestAccessCode, initialState);

  if (state.notFound) {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="No encontramos su farmacia">
          <p className="text-sm">
            El CIF <strong>{state.cif}</strong> con el email{' '}
            <strong className="break-all">{state.email}</strong> no coincide con ningún cliente activo.
          </p>
        </Alert>
        <div className="flex flex-col gap-2">
          <Link
            href={`/solicitud?cif=${encodeURIComponent(state.cif ?? '')}&email=${encodeURIComponent(state.email ?? '')}`}
            className="btn-primary w-full py-3 text-sm"
          >
            Solicitar alta de farmacia
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/acceso" className="btn-secondary w-full text-sm">
            Probar con otros datos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <div>
        <label className="label" htmlFor="cif">
          CIF / NIF de la farmacia
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
          <input
            id="cif"
            name="cif"
            type="text"
            autoComplete="off"
            autoFocus
            required
            placeholder="Ej. B12345678"
            defaultValue={state.cif}
            className="input pl-9 uppercase tracking-wide text-base"
          />
        </div>
        {state.fieldErrors?.cif && <p className="field-error">{state.fieldErrors.cif}</p>}
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email registrado
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="contacto@farmacia.com"
            defaultValue={state.email}
            className="input pl-9 text-base"
          />
        </div>
        {state.fieldErrors?.email && (
          <p className="field-error">{state.fieldErrors.email}</p>
        )}
      </div>

      <SubmitButton />

      <div className="text-center text-xs text-ink-500 pt-2 border-t border-ink-100">
        ¿Aún no es cliente?{' '}
        <Link href="/solicitud" className="text-brand-700 font-semibold hover:underline">
          Solicitar alta
        </Link>
      </div>
    </form>
  );
}
