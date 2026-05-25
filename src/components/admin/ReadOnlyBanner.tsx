import { Eye } from 'lucide-react';

/**
 * Banner persistente en la parte superior del panel admin cuando la sesión
 * tiene rol VIEWER (Supervisor de solo lectura). Aclara visualmente que
 * cualquier acción de modificación está bloqueada en el servidor.
 */
export function ReadOnlyBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <div className="mx-auto max-w-6xl flex items-start gap-2 text-sm text-amber-900">
        <Eye className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <div>
          <strong>Modo solo lectura</strong> — Estás conectado como{' '}
          <strong>Supervisor</strong>. Puedes navegar y consultar todo el panel,
          pero cualquier intento de modificar datos será rechazado por el servidor.
        </div>
      </div>
    </div>
  );
}
