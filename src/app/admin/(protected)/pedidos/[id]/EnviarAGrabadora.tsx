'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Send } from 'lucide-react';
import { useEstadoGrabadora } from '@/components/laser/estado-grabadora';
import { enviarAGrabadora, type EnviarState } from './enviar-grabadora';

const inicial: EnviarState = {};

function Boton({ lista }: { lista: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${lista ? 'btn-primary' : 'btn-secondary'} text-xs`}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      {pending ? 'Enviando…' : 'Enviar a la grabadora'}
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

  return (
    <form action={action} className="inline-flex flex-col gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="lineIndex" value={lineIndex} />
      <Boton lista={lista} />
      {estado && !estado.conectado && (
        <span className="text-[11px] text-ink-500">
          Grabadora apagada · quedará en cola
        </span>
      )}
      {state.mensaje && (
        <span className="text-[11px] text-emerald-700">{state.mensaje}</span>
      )}
      {state.error && (
        <span className="text-[11px] text-danger">{state.error}</span>
      )}
    </form>
  );
}
