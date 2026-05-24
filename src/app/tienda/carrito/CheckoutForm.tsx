'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { placeOrder, type CheckoutState } from './actions';

const initial: CheckoutState = {};

function Submit({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="btn-primary w-full text-base py-3">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
      {pending ? 'Enviando pedido…' : label}
    </button>
  );
}

interface Props {
  canSubmit: boolean;
  ctaLabel?: string;
  confirmLabel?: string;
}

export function CheckoutForm({ canSubmit, ctaLabel, confirmLabel }: Props) {
  const [state, action] = useFormState(placeOrder, initial);
  const cta = ctaLabel || 'Confirmar y enviar pedido';
  const confirm =
    confirmLabel ||
    'Confirmo que las pulseras, colores, unidades y textos grabados son correctos. Lomhifar fabricará el pedido exactamente con estos datos.';

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <div>
        <label className="label" htmlFor="note">
          Comentario para Lomhifar (opcional)
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={1000}
          className="input"
          placeholder="Ej: Por favor, entregar antes del viernes."
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-lg bg-brand-50/60 border border-brand-200">
        <input
          type="checkbox"
          name="confirm"
          required
          className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
        />
        <span className="text-sm text-ink-800 leading-relaxed">{confirm}</span>
      </label>
      {state.fieldErrors?.confirm && (
        <p className="field-error">{state.fieldErrors.confirm}</p>
      )}

      <Submit disabled={!canSubmit} label={cta} />
    </form>
  );
}
