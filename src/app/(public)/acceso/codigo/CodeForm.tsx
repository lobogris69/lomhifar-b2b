'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState, useTransition } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { resendAccessCode, verifyAccessCode, type VerifyCodeState } from '../actions';

const initial: VerifyCodeState = {};

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Verificando código…' : 'Entrar'}
    </button>
  );
}

export function CodeForm() {
  const [state, formAction] = useFormState(verifyAccessCode, initial);
  const [resending, startResend] = useTransition();
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  function handleResend() {
    startResend(async () => {
      setResendMsg(null);
      const res = await resendAccessCode();
      setResendMsg(res.ok ? 'Nuevo código enviado a su email.' : res.error ?? 'Error');
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {resendMsg && <Alert variant="success">{resendMsg}</Alert>}

      <div>
        <label className="label" htmlFor="code">
          Código de 6 dígitos
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoFocus
          required
          placeholder="••••••"
          className="input text-center text-2xl tracking-[0.5em] font-mono"
        />
        {state.fieldErrors?.code && <p className="field-error">{state.fieldErrors.code}</p>}
      </div>

      <VerifyButton />

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="btn-ghost w-full text-brand-700 hover:text-brand-800"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
        Reenviar código
      </button>
    </form>
  );
}
