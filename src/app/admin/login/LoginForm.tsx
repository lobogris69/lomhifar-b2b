'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
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
  return (
    <form action={action} className="space-y-4">
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
        <label className="label" htmlFor="password">Contraseña</label>
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
