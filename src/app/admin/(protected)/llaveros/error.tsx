'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Copy, RotateCw } from 'lucide-react';

/**
 * Qué se enseña cuando esta pantalla se rompe.
 *
 * Sin esto, Next pinta «Application error: a client-side exception has
 * occurred (see the browser console for more information)» y ya. El operario
 * no tiene por qué abrir la consola del navegador, y desde fuera es imposible
 * saber qué ha pasado.
 *
 * Aquí se enseña el error de verdad y se puede copiar de un botón.
 */
export default function ErrorDeLlaveros({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    // También a la consola, por si hace falta el rastro completo.
    // eslint-disable-next-line no-console
    console.error('[llaveros]', error);
  }, [error]);

  // Estos errores no son fallos del programa: son el navegador con el codigo
  // viejo hablando con el servidor nuevo, despues de publicar un cambio. El
  // mensaje tecnico no ayuda a nadie; lo que hay que hacer es recargar.
  const mensaje = error.message || '';
  const esVersionVieja = /is not a function|ChunkLoadError|Loading chunk|Failed to fetch|dynamically imported module/i
    .test(mensaje);

  const detalle = [
    error.message || 'sin mensaje',
    error.digest ? `digest: ${error.digest}` : '',
    (error.stack || '').split('\n').slice(0, 6).join('\n'),
  ].filter(Boolean).join('\n');

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl">
      <div className="card p-6 border-l-4 border-danger space-y-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-base font-bold text-ink-900">
              {esVersionVieja
                ? 'Esta pestaña tiene una versión antigua'
                : 'Se ha roto la pantalla de llaveros'}
            </h1>
            <p className="text-sm text-ink-600 mt-1">
              {esVersionVieja
                ? 'Se ha publicado un cambio mientras la tenías abierta. No se ha '
                  + 'perdido nada: recarga y sigue donde estabas.'
                : 'Lo que hayas subido está guardado: esto ha fallado al dibujar, no al '
                  + 'guardar. Prueba a recargar; si sigue, copia el detalle de aquí abajo.'}
            </p>
          </div>
        </div>

        {!esVersionVieja && (
          <pre className="text-[11px] bg-ink-950 text-ink-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-64">
            {detalle}
          </pre>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => (esVersionVieja ? window.location.reload() : reset())}
            className="btn-primary text-sm"
          >
            <RotateCw className="h-4 w-4" />
            {esVersionVieja ? 'Recargar' : 'Volver a intentarlo'}
          </button>
          {!esVersionVieja && <button
            type="button"
            className="btn-secondary text-sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(detalle);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              } catch {
                setCopiado(false);
              }
            }}
          >
            <Copy className="h-4 w-4" /> {copiado ? 'Copiado' : 'Copiar el detalle'}
          </button>}
          <a href="/admin/llaveros" className="btn-ghost text-sm">Recargar la pestaña</a>
        </div>
      </div>
    </div>
  );
}
