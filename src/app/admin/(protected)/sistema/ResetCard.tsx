'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import type { ResetState } from './actions';

const initial: ResetState = {};

interface Props {
  title: string;
  description: string;
  bullets: string[];
  buttonLabel: string;
  action: (prev: ResetState, formData: FormData) => Promise<ResetState>;
  /** Render del resultado tras la acción */
  renderResult?: (state: ResetState) => React.ReactNode;
}

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      {pending ? 'Borrando…' : label}
    </button>
  );
}

export function ResetCard({ title, description, bullets, buttonLabel, action, renderResult }: Props) {
  const [state, formAction] = useFormState(action, initial);
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText.trim().toUpperCase() === 'BORRAR';

  return (
    <div className="card p-6 border-l-4 border-red-300">
      <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        {title}
      </h3>
      <p className="text-sm text-ink-600 mt-1 leading-relaxed">{description}</p>

      <ul className="mt-3 space-y-1.5 text-xs text-ink-700">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <Trash2 className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {state.ok && state.ordersResult && (
        <Alert variant="success" className="mt-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">¡Pedidos borrados!</div>
              <div className="text-xs mt-1">
                {state.ordersResult.ordersDeleted} pedidos eliminados ·{' '}
                {state.ordersResult.itemsDeleted} líneas ·{' '}
                {state.ordersResult.movementsDeleted} movimientos de stock.
                {state.ordersResult.stockRestored.length > 0 && (
                  <>
                    {' '}Stock restaurado:{' '}
                    {state.ordersResult.stockRestored
                      .map((s) => `${s.color === 'BLACK' ? 'negra' : 'roja'} +${s.quantity}`)
                      .join(', ')}.
                  </>
                )}
              </div>
            </div>
          </div>
        </Alert>
      )}

      {state.ok && state.applicationsResult && (
        <Alert variant="success" className="mt-4">
          {state.applicationsResult.deleted} solicitudes de alta borradas.
        </Alert>
      )}

      {state.ok && state.sessionsResult && (
        <Alert variant="success" className="mt-4">
          {state.sessionsResult.sessionsDeleted} sesiones cerradas ·{' '}
          {state.sessionsResult.codesDeleted} códigos de acceso borrados.
        </Alert>
      )}

      {state.error && (
        <Alert variant="danger" className="mt-4">
          {state.error}
        </Alert>
      )}

      <form action={formAction} className="mt-4 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <label className="label text-xs text-ink-600" htmlFor={`confirm-${title}`}>
            Escribe <strong className="font-mono text-red-700">BORRAR</strong> para activar el botón
          </label>
          <input
            id={`confirm-${title}`}
            name="confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="BORRAR"
            className="input font-mono text-sm uppercase tracking-wide"
            autoComplete="off"
          />
        </div>
        <SubmitButton disabled={!isConfirmed} label={buttonLabel} />
      </form>
    </div>
  );
}
