'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Loader2, Printer, ExternalLink, Truck } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import {
  createMondialRelayLabel,
  type CreateMrLabelState,
} from '../actions';

const initial: CreateMrLabelState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full text-sm"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
      {pending ? 'Llamando a Mondial Relay…' : 'Generar etiqueta Mondial Relay'}
    </button>
  );
}

/**
 * Tarjeta cliente que llama al server action createMondialRelayLabel.
 * Si el envío es por punto de recogida (24R) puede pasar el ID del relay
 * que el admin haya elegido.
 */
export function GenerateMondialRelayLabel({
  orderId,
  destCP,
}: {
  orderId: string;
  destCP: string;
}) {
  const [state, action] = useFormState(createMondialRelayLabel, initial);
  const [relayId, setRelayId] = useState('');

  return (
    <div className="card p-4 border-l-4 border-brand-400 bg-brand-50/30">
      <div className="text-sm font-semibold text-ink-900 mb-1 flex items-center gap-2">
        <Truck className="h-4 w-4 text-brand-700" />
        Generación automática · Mondial Relay
      </div>
      <p className="text-[11px] text-ink-600 mb-3 leading-relaxed">
        Llama a la API de Mondial Relay (SOAP) y crea la etiqueta para este pedido.
        Te devolverá el nº de tracking + URL del PDF para imprimir. CP destinatario: {' '}
        <span className="font-mono">{destCP}</span>
      </p>

      <form action={action} className="space-y-2">
        <input type="hidden" name="orderId" value={orderId} />

        <div>
          <label className="label text-xs" htmlFor="relayId">
            ID del Punto Pack / Locker (opcional · solo modo 24R)
          </label>
          <input
            id="relayId"
            name="relayId"
            type="text"
            value={relayId}
            onChange={(e) => setRelayId(e.target.value.trim())}
            placeholder="dejar vacío para entrega a domicilio"
            className="input font-mono text-xs"
            autoComplete="off"
          />
          <p className="text-[10px] text-ink-500 mt-1">
            Si quieres entrega en un Punto Pack/Locker específico pega aquí su ID (el
            cliente puede haberlo elegido). Si lo dejas vacío y el modo es 24R, MR
            asignará uno automáticamente cercano al CP.
          </p>
        </div>

        <Submit />
      </form>

      {state.error && (
        <Alert variant="danger" className="mt-3">
          {state.error}
        </Alert>
      )}

      {state.ok && state.trackingNumber && (
        <Alert variant="success" className="mt-3">
          <div className="space-y-2">
            <div className="text-sm">
              ✅ Etiqueta generada · nº de seguimiento:{' '}
              <strong className="font-mono">{state.trackingNumber}</strong>
            </div>
            {state.labelUrl && (
              <a
                href={state.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs inline-flex"
              >
                <Printer className="h-3.5 w-3.5" /> Descargar etiqueta PDF
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <div className="text-[11px] text-ink-600">
              El nº de tracking ya se ha guardado en el pedido y el estado pasa a
              SHIPPED. Pulsa el botón &laquo;Notificar al cliente por email&raquo; en la sección
              de tracking de arriba si quieres avisar.
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}
