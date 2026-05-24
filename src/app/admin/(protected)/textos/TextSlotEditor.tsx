'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, RotateCcw, Check } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { resetTextToDefault, updateSiteText, type UpdateTextState } from './actions';
import type { SiteTextWithMeta } from '@/lib/site-texts';

const initial: UpdateTextState = {};

function Submit({ slotKey }: { slotKey: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs">
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      {pending ? 'Guardando…' : 'Guardar'}
    </button>
  );
}

export function TextSlotEditor({ slot }: { slot: SiteTextWithMeta }) {
  const [state, action] = useFormState(updateSiteText, initial);
  const showOk = state.ok && state.key === slot.key;
  const showErr = state.error && state.key === slot.key;

  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-ink-900">{slot.label}</h3>
            {slot.isCustom ? (
              <span className="badge-brand">Personalizado</span>
            ) : (
              <span className="badge-muted text-[10px]">Default</span>
            )}
          </div>
          {slot.description && (
            <p className="text-[11px] text-ink-500 mt-0.5">{slot.description}</p>
          )}
        </div>
        {slot.isCustom && (
          <form action={resetTextToDefault}>
            <input type="hidden" name="key" value={slot.key} />
            <button
              type="submit"
              className="btn-ghost text-[11px] text-ink-500 hover:text-danger"
              title="Restaurar valor por defecto"
            >
              <RotateCcw className="h-3 w-3" /> Restaurar default
            </button>
          </form>
        )}
      </div>

      <form action={action} className="space-y-2">
        <input type="hidden" name="key" value={slot.key} />
        {slot.type === 'long' ? (
          <textarea
            name="value"
            defaultValue={slot.currentValue}
            maxLength={slot.maxLength}
            rows={3}
            className="input text-sm"
          />
        ) : slot.type === 'select' && slot.options ? (
          <select name="value" defaultValue={slot.currentValue} className="input text-sm">
            {slot.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            name="value"
            type="text"
            defaultValue={slot.currentValue}
            maxLength={slot.maxLength}
            className="input text-sm"
          />
        )}

        {showErr && <Alert variant="danger">{state.error}</Alert>}
        {showOk && <Alert variant="success">✓ Guardado.</Alert>}

        <div className="flex items-center justify-between text-[11px] text-ink-400">
          <div>
            {slot.maxLength && slot.type !== 'select' && (
              <span>Máx. {slot.maxLength} caracteres</span>
            )}
          </div>
          <Submit slotKey={slot.key} />
        </div>

        {/* Default reference */}
        {slot.isCustom && (
          <details className="mt-2 text-[11px] text-ink-400">
            <summary className="cursor-pointer">Ver valor original</summary>
            <p className="mt-1 italic break-words">{slot.defaultValue}</p>
          </details>
        )}
      </form>
    </div>
  );
}
