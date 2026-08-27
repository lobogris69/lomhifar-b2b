'use client';

import { Loader2 } from 'lucide-react';
import { useEstadoGrabadora } from './estado-grabadora';

const COLOR = {
  ok: 'bg-emerald-500',
  aviso: 'bg-amber-500',
  mal: 'bg-ink-300',
} as const;

const TEXTO = {
  ok: 'text-emerald-700',
  aviso: 'text-amber-700',
  mal: 'text-ink-500',
} as const;

/**
 * Semáforo de la grabadora: verde lista, ámbar ocupada, gris apagada.
 *
 * Sustituye a mirar la ventana del programa del taller.
 */
export function IndicadorGrabadora({ className = '' }: { className?: string }) {
  const estado = useEstadoGrabadora();

  if (!estado) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] text-ink-400 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Comprobando la grabadora…
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] ${TEXTO[estado.tono]} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${COLOR[estado.tono]} ${estado.conectado ? 'animate-pulse' : ''}`} />
      {estado.texto}
    </span>
  );
}
