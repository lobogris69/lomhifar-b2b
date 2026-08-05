'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
  changePassword,
  changeProfile,
  type ChangePasswordState,
  type ChangeProfileState,
} from './actions';

function Submit({ label, busyLabel }: { label: string; busyLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? busyLabel : label}
    </button>
  );
}

const initialPassword: ChangePasswordState = {};
const initialProfile: ChangeProfileState = {};

export function ChangePasswordForm() {
  const [state, action] = useFormState(changePassword, initialPassword);
  return (
    <form action={action} className="space-y-4">
      {state.ok && <Alert variant="success">Contraseña actualizada correctamente.</Alert>}
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <div>
        <label className="label" htmlFor="currentPassword">Contraseña actual</label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          required
          autoComplete="off"
          placeholder="Tu contraseña actual"
        />
        {state.fieldErrors?.currentPassword && (
          <p className="field-error">{state.fieldErrors.currentPassword}</p>
        )}
        <p className="mt-1 text-xs text-ink-500">
          Pulsa el ojo 👁 para ver lo que escribes y asegurarte de que es correcta.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="newPassword">Contraseña nueva</label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Nueva contraseña (mín. 8)"
        />
        {state.fieldErrors?.newPassword && (
          <p className="field-error">{state.fieldErrors.newPassword}</p>
        )}
        <p className="mt-1 text-xs text-ink-500">
          Mínimo 8 caracteres. Mejor solo letras y números (sin símbolos raros).
        </p>
      </div>

      <div>
        <label className="label" htmlFor="confirmPassword">Repite la nueva</label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          autoComplete="new-password"
          placeholder="Repite la nueva contraseña"
        />
        {state.fieldErrors?.confirmPassword && (
          <p className="field-error">{state.fieldErrors.confirmPassword}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Submit label="Cambiar contraseña" busyLabel="Cambiando…" />
      </div>
    </form>
  );
}

export function ChangeProfileForm({ defaultName, email }: { defaultName: string; email: string }) {
  const [state, action] = useFormState(changeProfile, initialProfile);
  return (
    <form action={action} className="space-y-4">
      {state.ok && <Alert variant="success">Perfil actualizado.</Alert>}

      <div>
        <label className="label">Email</label>
        <input type="email" defaultValue={email} disabled className="input bg-ink-50" />
        <p className="mt-1 text-xs text-ink-500">
          Para cambiar tu email, hazlo desde Railway en la variable <code>ADMIN_EMAIL</code> y vuelve a desplegar.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="name">Nombre a mostrar</label>
        <input
          id="name"
          name="name"
          defaultValue={defaultName}
          className="input"
          placeholder="Ej. Fran Ayllón"
        />
      </div>

      <div className="flex justify-end">
        <Submit label="Guardar perfil" busyLabel="Guardando…" />
      </div>
    </form>
  );
}
