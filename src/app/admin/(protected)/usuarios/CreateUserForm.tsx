'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { ADMIN_ROLES, ADMIN_ROLE_LABEL, ADMIN_ROLE_DESCRIPTION } from '@/lib/admin-roles';
import { createAdminUser, type CreateAdminState } from './actions';

const initial: CreateAdminState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      {pending ? 'Creando…' : 'Crear usuario'}
    </button>
  );
}

export function CreateUserForm() {
  const [state, action] = useFormState(createAdminUser, initial);
  const [resetKey, setResetKey] = useState(0);

  // Cuando se crea exitosamente, reset del form
  if (state.ok && resetKey === 0) {
    setTimeout(() => setResetKey(1), 0);
  }

  return (
    <form action={action} className="space-y-4" key={resetKey}>
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {state.ok && <Alert variant="success">Usuario creado correctamente.</Alert>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="email">Email <span className="text-danger">*</span></label>
          <input id="email" name="email" type="email" required className="input" />
          {state.fieldErrors?.email && <p className="field-error">{state.fieldErrors.email}</p>}
        </div>
        <div>
          <label className="label" htmlFor="name">Nombre</label>
          <input id="name" name="name" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña inicial <span className="text-danger">*</span></label>
          <input id="password" name="password" type="text" required minLength={8} className="input font-mono" />
          {state.fieldErrors?.password && <p className="field-error">{state.fieldErrors.password}</p>}
          <p className="mt-1 text-xs text-ink-500">Mínimo 8 caracteres. Compártela al usuario por canal seguro.</p>
        </div>
        <div>
          <label className="label" htmlFor="role">Rol <span className="text-danger">*</span></label>
          <select id="role" name="role" required defaultValue="ADMIN" className="input">
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>{ADMIN_ROLE_LABEL[r]} — {ADMIN_ROLE_DESCRIPTION[r]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
