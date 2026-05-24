'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { adminLogin, type AdminLoginState } from './actions';

const initial: AdminLoginState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-sm">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Accediendo…' : 'Acceder al panel'}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(adminLogin, initial);
  const params = useSearchParams();
  const justReset = params.get('reset') === 'ok';

  return (
    <form action={action} className="space-y-4">
      {justReset && (
        <Alert variant="success" title="Contraseña actualizada">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Ya puedes entrar con tu nueva contraseña.
          </span>
        </Alert>
      )}
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <div>
        <label className="label" htmlFor="email">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="username"
            defaultValue={state.email}
            placeholder="admin@lomhifar.com"
            className="input pl-9"
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label className="label" htmlFor="password">Contraseña</label>
          <Link
            href="/admin/recuperar"
            className="text-xs text-brand-700 hover:underline mb-1.5"
          >
            ¿La has olvidado?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="input pl-9"
          />
        </div>
      </div>

      <Submit />
    </form>
  );
}
