'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { AlertTriangle, Loader2, Send } from 'lucide-react';
import { useEstadoGrabadora } from '@/components/laser/estado-grabadora';
import { enviarAGrabadora, type EnviarState } from './enviar-grabadora';

const inicial: EnviarState = {};

function Boton({ lista, repetir }: { lista: boolean; repetir: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${repetir ? 'btn-danger' : lista ? 'btn-primary' : 'btn-secondary'} text-xs`}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      {pending
        ? 'Enviando…'
        : repetir
          ? 'Sí, grabar otra vez'
          : 'Enviar a la grabadora'}
    </button>
  );
}

/**
 * Manda este grabado a la cola del taller.
 *
 * No dispara el láser: el puente lo prepara y la máquina espera al pedal del
 * operario. Por eso el botón dice «enviar» y no «grabar».
 *
 * El botón se enciende cuando la grabadora está lista. Con la máquina apagada
 * sigue dejando enviar a propósito: el trabajo espera en la cola y se recoge
 * solo al encenderla, así se puede dejar preparado el trabajo del día.
 *
 * Si el grabado ya se hizo antes, el primer clic no envía nada: avisa y pide
 * confirmación. Repetir es normal —salió mal, o hacen falta más unidades— pero
 * tiene que ser queriendo, porque gasta una pulsera.
 */
export function EnviarAGrabadora({
  orderId,
  lineIndex,
}: {
  orderId: string;
  lineIndex: number;
}) {
  const [state, action] = useFormState(enviarAGrabadora, inicial);
  const estado = useEstadoGrabadora();
  const lista = estado?.conectado === true;
  const repetir = state.repetir === true;

  return (
    <form action={action} className="inline-flex flex-col gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="lineIndex" value={lineIndex} />
      {/* El segundo clic ya va con el visto bueno. */}
      <input type="hidden" name="confirmado" value={repetir ? '1' : '0'} />

      {repetir && (
        <span className="inline-flex items-start gap-1 text-[11px] text-amber-700 max-w-[240px]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
          {state.mensaje}
        </span>
      )}

      <Boton lista={lista} repetir={repetir} />

      {estado && !estado.conectado && !repetir && (
        <span className="text-[11px] text-ink-500">
          Grabadora apagada · quedará en cola
        </span>
      )}
      {state.mensaje && !repetir && (
        <span className="text-[11px] text-emerald-700">{state.mensaje}</span>
      )}
      {state.error && (
        <span className="text-[11px] text-danger">{state.error}</span>
      )}
    </form>
  );
}
