'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Avisa cuando se ha publicado una versión nueva del panel.
 *
 * Al publicar un cambio, la pestaña que ya estaba abierta se queda con el
 * código viejo: los botones nuevos no aparecen y, al pulsar uno, el navegador
 * suelta un «Application error» genérico porque el código no cuadra con el
 * del servidor. Es de las cosas que más tiempo hacen perder, porque no parece
 * lo que es.
 *
 * Se pregunta cada 20 segundos, y solo cuando la pestaña está a la vista: no
 * tiene sentido consultar en segundo plano una pestaña que nadie mira.
 * Cada minuto se quedaba corto — dio tiempo a pulsar un botón entre dos
 * consultas y llevarse el error.
 */
const CADA = 20_000;

export function AvisoDeVersion() {
  const [hayOtra, setHayOtra] = useState(false);

  useEffect(() => {
    let miVersion: string | null = null;
    let vivo = true;

    async function mirar() {
      if (document.visibilityState !== 'visible') return;
      try {
        const r = await fetch('/api/version', { cache: 'no-store' });
        if (!r.ok) return;
        const { version } = await r.json();
        if (!version || version === 'desconocida') return;
        if (miVersion === null) {
          miVersion = version;          // la primera lectura es la de referencia
        } else if (version !== miVersion && vivo) {
          setHayOtra(true);
        }
      } catch {
        // Sin conexión no se avisa de nada: no es asunto de este aviso.
      }
    }

    void mirar();
    const t = setInterval(mirar, CADA);
    document.addEventListener('visibilitychange', mirar);
    return () => {
      vivo = false;
      clearInterval(t);
      document.removeEventListener('visibilitychange', mirar);
    };
  }, []);

  if (!hayOtra) return null;

  return (
    <div className="sticky top-0 z-40 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium">
      <RefreshCw className="h-4 w-4 shrink-0" />
      <span>Hay una versión nueva del panel. Recarga para que los cambios te salgan.</span>
      <button
        type="button"
        // Recarga de verdad, saltándose lo que el navegador tenga guardado.
        onClick={() => window.location.reload()}
        className="rounded-lg bg-amber-950 text-amber-50 px-3 py-1 text-xs font-semibold hover:bg-amber-900"
      >
        Recargar ahora
      </button>
    </div>
  );
}
