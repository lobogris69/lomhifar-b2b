'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { requestReset, type RequestResetState } from './actions';

const initial: RequestResetState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-sm">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      {pending ? 'Enviando…' : 'Enviarme enlace de recuperación'}
    </button>
  );
}

export function RequestResetForm() {
  const [state, action] = useFormState(requestReset, initial);

  if (state.ok) {
    return (
      <Alert variant="success" title="Comprueba tu email">
        Si el email pertenece a una cuenta admin activa, recibirás un enlace para restablecer la contraseña.
        El enlace es válido durante 1 hora. Revisa también la carpeta de spam.
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <div>
        <label className="label" htmlFor="email">Email de tu cuenta admin</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="admin@lomhifar.com"
          className="input"
        />
      </div>
      <Submit />
    </form>
  );
}
