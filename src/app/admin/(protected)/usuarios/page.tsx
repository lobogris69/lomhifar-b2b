import { Users2, ShieldAlert, Power, Trash2, KeyRound } from 'lucide-react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { ADMIN_ROLE_LABEL, type AdminRole } from '@/lib/admin-roles';
import { formatDate } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { CreateUserForm } from './CreateUserForm';
import { RoleSelect } from './RoleSelect';
import {
  deleteAdminUser,
  resetAdminPassword,
  toggleAdminActive,
} from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Usuarios admin Â· Lomhifar' };

const ROLE_BADGE: Record<AdminRole, string> = {
  SUPER_ADMIN: 'bg-brand-100 text-brand-800',
  ADMIN: 'bg-sky-100 text-sky-800',
  ORDER_MANAGER: 'bg-emerald-100 text-emerald-800',
  VIEWER: 'bg-amber-100 text-amber-800',
};

export default async function UsersPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-3xl">
        <Alert variant="danger" title="Acceso restringido">
          Solo el rol <strong>SUPER_ADMIN</strong> puede gestionar usuarios administradores.
          Tu rol actual es <strong>{ADMIN_ROLE_LABEL[(session.role as AdminRole) ?? 'ADMIN']}</strong>.
        </Alert>
      </div>
    );
  }

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl space-y-8">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Users2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Usuarios administradores</h1>
          <p className="section-subtitle">Crea, desactiva o cambia el rol de los usuarios admin.</p>
        </div>
      </div>

      <Alert variant="info" title="Roles disponibles">
        <ul className="text-sm space-y-0.5 mt-1">
          <li>Â· <strong>Super-Admin:</strong> acceso total + gestiÃ³n de usuarios admin (este panel)</li>
          <li>Â· <strong>Administrador:</strong> acceso total excepto crear/borrar usuarios admin</li>
          <li>Â· <strong>Gestor de pedidos:</strong> solo puede ver pedidos y cambiar su estado</li>
          <li>Â· <strong>Supervisor (solo lectura):</strong> ve todo el panel pero NO puede modificar nada â€” ideal para auditores o socios</li>
        </ul>
      </Alert>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-ink-900 mb-4">Crear nuevo usuario</h2>
        <CreateUserForm />
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-3 border-b border-ink-100">
          <h2 className="text-sm font-semibold text-ink-900">
            Usuarios actuales ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
        <table className="table-pro min-w-[640px]">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Alta</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u.id === session.id;
              return (
                <tr key={u.id} className={isMe ? 'bg-brand-50/40' : ''}>
                  <td className="font-medium">
                    {u.email}
                    {isMe && <span className="ml-2 text-[10px] uppercase tracking-wider text-brand-700">(tÃº)</span>}
                  </td>
                  <td>{u.name ?? 'â€”'}</td>
                  <td>
                    <RoleSelect
                      userId={u.id}
                      currentRole={u.role}
                      isMe={isMe}
                      badgeClass={ROLE_BADGE[u.role as AdminRole] ?? 'bg-ink-100'}
                    />
                  </td>
                  <td>
                    {u.active ? (
                      <span className="badge-success">Activo</span>
                    ) : (
                      <span className="badge-danger">Inactivo</span>
                    )}
                  </td>
                  <td className="text-xs text-ink-500">{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <details className="relative">
                        <summary className="btn-ghost cursor-pointer list-none" title="Resetear contraseÃ±a">
                          <KeyRound className="h-3.5 w-3.5" />
                        </summary>
                        <form
                          action={resetAdminPassword}
                          className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] card p-3 z-10 space-y-2"
                        >
                          <input type="hidden" name="id" value={u.id} />
                          <label className="text-xs text-ink-700">Nueva contraseÃ±a (mÃ­n 8):</label>
                          <input
                            type="text"
                            name="newPassword"
                            minLength={8}
                            required
                            className="input text-sm font-mono"
                            autoComplete="off"
                          />
                          <button type="submit" className="btn-primary text-xs w-full">
                            Cambiar contraseÃ±a
                          </button>
                        </form>
                      </details>

                      <form action={toggleAdminActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          disabled={isMe}
                          className="btn-ghost disabled:opacity-30"
                          title={isMe ? 'No puedes desactivarte a ti mismo' : (u.active ? 'Desactivar' : 'Activar')}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      </form>

                      <form action={deleteAdminUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          disabled={isMe}
                          className="btn-ghost text-danger disabled:opacity-30"
                          title={isMe ? 'No puedes borrarte a ti mismo' : 'Eliminar'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
