'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { KeyRound, Check, Loader2, AlertCircle } from 'lucide-react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { resetAdminPassword, type ResetPwState } from './actions';

const initial: ResetPwState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs w-full">
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {pending ? 'Guardando…' : 'Cambiar contraseña'}
    </button>
  );
}

export function ResetPasswordButton({ userId, isMe }: { userId: string; isMe: boolean }) {
  const [state, action] = useFormState(resetAdminPassword, initial);

  return (
    <details className="relative">
      <summary className="btn-ghost cursor-pointer list-none" title="Cambiar contraseña">
        <KeyRound className="h-3.5 w-3.5" />
      </summary>
      <form
        action={action}
        className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] card p-3 z-10 space-y-2 text-left"
      >
        <input type="hidden" name="id" value={userId} />
        <label className="text-xs text-ink-700 block">
          {isMe ? 'Tu nueva contraseña' : 'Nueva contraseña'} (mín. 8 caracteres):
        </label>
        <PasswordInput
          name="newPassword"
          minLength={8}
          required
          autoComplete="new-password"
          className="text-sm font-mono"
        />

        {state.ok && (
          <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
            <Check className="h-3.5 w-3.5 shrink-0" />
            ¡Contraseña actualizada! Ya puedes entrar con ella.
          </p>
        )}
        {state.error && (
          <p className="text-xs text-red-600 font-semibold flex items-center gap-1 bg-red-50 border border-red-200 rounded px-2 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {state.error}
          </p>
        )}

        <Submit />
        {isMe && (
          <p className="text-[11px] text-ink-500 leading-snug">
            Es tu propia cuenta: al cambiarla NO se te pedirá cambiarla otra vez al entrar.
          </p>
        )}
      </form>
    </details>
  );
}
