import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

/**
 * Banner persistente en la parte superior del panel admin cuando la sesión
 * tiene el flag mustChangePassword (admin recién creado o reseteado).
 */
export function MustChangePasswordBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <strong>Cambia tu contraseña</strong> — Estás usando una contraseña asignada por
            un administrador. Por seguridad, define ahora una nueva que solo tú conozcas.
          </div>
        </div>
        <Link href="/admin/perfil" className="btn-primary bg-amber-500 hover:bg-amber-600 text-amber-950 text-sm">
          Cambiar contraseña
        </Link>
      </div>
    </div>
  );
}
