'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Crosshair, Loader2, Plus, PowerOff } from 'lucide-react';
import { useEstadoGrabadora } from './estado-grabadora';
import { mostrarReferencia, type PunteroState } from './puntero-actions';

const inicial: PunteroState = {};

function Boton({
  modo,
  texto,
  icono,
  activo,
  desactivado,
}: {
  modo: string;
  texto: string;
  icono: React.ReactNode;
  activo: boolean;
  desactivado: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="modo"
      value={modo}
      disabled={pending || desactivado}
      className={`${activo ? 'btn-primary' : 'btn-secondary'} text-xs`}
      title={desactivado ? 'La grabadora está apagada' : undefined}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icono}
      {texto}
    </button>
  );
}

/**
 * Enciende el puntero rojo del taller desde la web.
 *
 * Sirve para colocar la pieza en el útil sin bajar a la máquina a teclear
 * comandos. El puntero NO dispara: mueve los espejos con el diodo rojo para
 * enseñar dónde va a caer el grabado.
 *
 * Se apaga solo al mandar un trabajo a la grabadora: el puente no puede
 * pasear el puntero y preparar un grabado a la vez.
 */
export function BotonReferencia({
  referencia,
  etiqueta,
}: {
  /** Qué recuadro tiene sentido en esta pantalla. */
  referencia: 'pulsera' | 'llavero';
  etiqueta: string;
}) {
  const [state, action] = useFormState(mostrarReferencia, inicial);
  const estado = useEstadoGrabadora();
  const apagada = estado ? !estado.conectado : false;

  return (
    <form action={action} className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-ink-500">Puntero rojo:</span>
      <Boton
        modo={referencia}
        texto={etiqueta}
        icono={<Crosshair className="h-3.5 w-3.5" />}
        activo={state.modo === referencia}
        desactivado={apagada}
      />
      <Boton
        modo="centro"
        texto="Cruz del centro"
        icono={<Plus className="h-3.5 w-3.5" />}
        activo={state.modo === 'centro'}
        desactivado={apagada}
      />
      <Boton
        modo="apagar"
        texto="Apagar"
        icono={<PowerOff className="h-3.5 w-3.5" />}
        activo={state.modo === 'apagar'}
        desactivado={apagada}
      />

      {state.error && <span className="text-[11px] text-danger">{state.error}</span>}
      {state.ok && !state.error && (
        <span className="text-[11px] text-ink-500">
          {state.modo === 'apagar'
            ? 'Apagando…'
            : 'Encendiendo… tarda unos segundos en llegar al taller.'}
        </span>
      )}
      {apagada && (
        <span className="text-[11px] text-ink-500">La grabadora está apagada.</span>
      )}
    </form>
  );
}
