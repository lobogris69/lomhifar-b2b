'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Send } from 'lucide-react';
import { enviarAGrabadora, type EnviarState } from './enviar-grabadora';

const inicial: EnviarState = {};

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs">
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
 */
export function EnviarAGrabadora({
  orderId,
  lineIndex,
}: {
  orderId: string;
  lineIndex: number;
}) {
  const [state, action] = useFormState(enviarAGrabadora, inicial);

  return (
    <form action={action} className="inline-flex flex-col gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="lineIndex" value={lineIndex} />
      <Boton />
      {state.mensaje && (
        <span className="text-[11px] text-emerald-700">{state.mensaje}</span>
      )}
      {state.error && (
        <span className="text-[11px] text-danger">{state.error}</span>
      )}
    </form>
  );
}
