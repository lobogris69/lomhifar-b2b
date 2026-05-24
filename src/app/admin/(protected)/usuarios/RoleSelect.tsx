'use client';

import { changeAdminRole } from './actions';

interface Props {
  userId: string;
  currentRole: string;
  isMe: boolean;
  badgeClass: string;
}

/**
 * Select inline que cambia el rol del usuario al seleccionar uno nuevo.
 * Auto-submit del form contenedor para que el server action haga el update.
 * Es Client Component porque usa onChange (event handler).
 */
export function RoleSelect({ userId, currentRole, isMe, badgeClass }: Props) {
  return (
    <form action={changeAdminRole}>
      <input type="hidden" name="id" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        disabled={isMe}
        className={`text-xs rounded-full px-2 py-0.5 font-medium border-0 ${badgeClass} ${isMe ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <option value="SUPER_ADMIN">Super-Admin</option>
        <option value="ADMIN">Administrador</option>
        <option value="ORDER_MANAGER">Gestor pedidos</option>
      </select>
    </form>
  );
}
