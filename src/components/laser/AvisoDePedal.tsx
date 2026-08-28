'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Footprints, Loader2, XCircle, Zap } from 'lucide-react';
import { useEstadoGrabadora } from './estado-grabadora';
import { cancelarLoEncolado, type CancelarState } from './cancelar-actions';

const inicial: CancelarState = {};

function BotonCancelar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold hover:bg-white"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
      {pending ? 'Cancelando…' : 'Cancelar'}
    </button>
  );
}

/**
 * El cartel de «ya puedes pisar el pedal».
 *
 * Va FIJO arriba de la pantalla mientras hay algo entre manos. Antes estaba
 * al principio de la página y, trabajando con un diseño del final de la
 * lista, había que subir del todo para verlo.
 *
 * El boton de Cancelar NO es un paro de emergencia y no se presenta como tal:
 * viaja por internet y el puente pregunta cada pocos segundos. Para parar la
 * maquina de verdad esta su interruptor. Sirve para lo corriente: diseño
 * equivocado, o la pieza mal puesta, y no quieres que grabe al rozar el pedal.
 */
export function AvisoDePedal() {
  const estado = useEstadoGrabadora();
  const [cancel, accionCancelar] = useFormState(cancelarLoEncolado, inicial);

  const haciendo = estado?.conectado ? estado.haciendo : undefined;
  if (!haciendo) return null;

  const armada = haciendo.startsWith('LISTO');
  const grabando = haciendo.startsWith('Grabando');

  // El puente manda «orden · detalle»: la primera parte dice qué hacer.
  const partes = haciendo.split(' · ');
  const orden = partes[0];
  const detalle = partes.slice(1).join(' · ');

  const colores = armada
    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
    : grabando
      ? 'border-amber-500 bg-amber-50 text-amber-900'
      : 'border-ink-300 bg-ink-100 text-ink-800';

  return (
    <div className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-10 mb-4 border-b-4 px-4 sm:px-6 lg:px-10 py-3 ${colores}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
          armada ? 'bg-emerald-600' : grabando ? 'bg-amber-500' : 'bg-ink-500'
        }`}>
          {armada ? <Footprints className="h-5 w-5" />
            : grabando ? <Zap className="h-5 w-5" />
              : <Loader2 className="h-5 w-5 animate-spin" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">
            {armada
              ? (orden.includes('ENTER')
                ? 'Lista: el pedal no responde, pulsa ENTER en la ventana del puente'
                : 'La máquina está lista: pisa el pedal y mantenlo un segundo')
              : grabando ? 'Grabando…' : orden}
          </div>
          {detalle && <div className="text-[11px] opacity-80 truncate">{detalle}</div>}
          {cancel.mensaje && <div className="text-[11px] font-medium mt-0.5">{cancel.mensaje}</div>}
          {cancel.error && <div className="text-[11px] text-danger mt-0.5">{cancel.error}</div>}
        </div>

        {!grabando && (
          <form action={accionCancelar}>
            <BotonCancelar />
          </form>
        )}
      </div>
    </div>
  );
}
