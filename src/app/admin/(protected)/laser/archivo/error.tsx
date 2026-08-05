'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

/**
 * Red de seguridad para /admin/laser/archivo: si el render de la página
 * lanzara una excepción, en vez de un 500 crudo el admin ve un aviso
 * legible con el identificador del error (digest) para poder reportarlo.
 */
export default function LaserArchiveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl">
      <Link
        href="/admin/laser"
        className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a configuración láser
      </Link>
      <div className="card p-6 border-l-4 border-red-500 bg-red-50/40">
        <h1 className="text-lg font-semibold text-red-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> No se pudo mostrar el histórico
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Ha ocurrido un problema al pintar esta página. Tus archivos láser
          NO se han perdido: siguen guardados y puedes descargarlos desde cada
          pedido. Inténtalo de nuevo; si persiste, avísame con este código.
        </p>
        <p className="mt-3 text-xs font-mono text-ink-500">
          Ref: {error.digest ?? error.message ?? 'desconocido'}
        </p>
        <button onClick={() => reset()} className="btn-primary mt-4 text-sm">
          Reintentar
        </button>
      </div>
    </div>
  );
}
