'use client';

import { Footprints, Loader2, Zap } from 'lucide-react';
import { useEstadoGrabadora } from './estado-grabadora';

/**
 * El cartel de «ya puedes pisar el pedal».
 *
 * El puente prepara el trabajo y se queda esperando, pero eso hasta ahora solo
 * se veía en la ventana del programa del taller o en letra pequeña arriba a la
 * derecha. Si estás en el ordenador, mirando la pantalla, tienes que enterarte
 * desde la pantalla.
 *
 * Solo aparece cuando hay algo entre manos: el resto del tiempo no ocupa sitio.
 */
export function AvisoDePedal() {
  const estado = useEstadoGrabadora();
  const haciendo = estado?.conectado ? estado.haciendo : undefined;
  if (!haciendo) return null;

  const armada = haciendo.startsWith('LISTO');
  const grabando = haciendo.startsWith('Grabando');

  // Del texto que manda el puente, la primera parte es la orden y el resto
  // dice de qué trabajo se trata.
  const partes = haciendo.split(' · ');
  const orden = partes[0];
  const detalle = partes.slice(1).join(' · ');

  if (armada) {
    return (
      <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4 flex items-center gap-4 animate-pulse">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Footprints className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <div className="text-base font-bold text-emerald-900">
            La máquina está lista: pisa el pedal
          </div>
          <div className="text-xs text-emerald-800/80 mt-0.5">
            {orden.includes('ENTER')
              ? 'El pedal no responde: pulsa ENTER en la ventana del puente.'
              : 'Mantenlo pisado un segundo. Hasta que no lo pises no graba nada.'}
          </div>
          {detalle && (
            <div className="text-[11px] text-emerald-800/70 mt-0.5 truncate">{detalle}</div>
          )}
        </div>
      </div>
    );
  }

  if (grabando) {
    return (
      <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-4 flex items-center gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <Zap className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <div className="text-base font-bold text-amber-900">Grabando…</div>
          <div className="text-[11px] text-amber-800/70 mt-0.5 truncate">{detalle}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-3 flex items-center gap-3">
      <Loader2 className="h-4 w-4 animate-spin text-ink-500 shrink-0" />
      <span className="text-sm text-ink-700 truncate">{haciendo}</span>
    </div>
  );
}
