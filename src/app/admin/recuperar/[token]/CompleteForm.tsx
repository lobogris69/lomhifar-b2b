'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { completeReset, type CompleteResetState } from '../actions';

const initial: CompleteResetState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-sm">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Guardando…' : 'Guardar nueva contraseña'}
    </button>
  );
}

export function CompleteResetForm({ token }: { token: string }) {
  const [state, action] = useFormState(completeReset, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <div>
        <label className="label" htmlFor="newPassword">Nueva contraseña</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
        {state.fieldErrors?.newPassword && <p className="field-error">{state.fieldErrors.newPassword}</p>}
        <p className="mt-1 text-xs text-ink-500">Mínimo 8 caracteres.</p>
      </div>

      <div>
        <label className="label" htmlFor="confirmPassword">Repite la contraseña</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="input"
        />
        {state.fieldErrors?.confirmPassword && <p className="field-error">{state.fieldErrors.confirmPassword}</p>}
      </div>

      <Submit />
    </form>
  );
}
