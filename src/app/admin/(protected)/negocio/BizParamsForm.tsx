'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Save, Loader2, SlidersHorizontal } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { saveBizParams, type SaveBizState } from './actions';

const initial: SaveBizState = {};

interface Props {
  initialValues: {
    costBlack: number;   // euros
    costRed: number;
    costEngraving: number;
    costShipping: number;
    commission: number;
    machinePrice: number;
    machineLife: number;
  };
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Guardando…' : 'Guardar parámetros'}
    </button>
  );
}

export function BizParamsForm({ initialValues }: Props) {
  const [state, action] = useFormState(saveBizParams, initial);

  return (
    <details className="card overflow-hidden">
      <summary className="px-5 py-3 border-b border-ink-100 bg-ink-50/40 cursor-pointer flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-brand-700" />
        <span className="text-sm font-semibold text-ink-900">Parámetros de coste (editar)</span>
        <span className="ml-auto text-xs text-ink-400">Estos valores alimentan todos los cálculos de arriba</span>
      </summary>
      <form action={action} className="p-5 space-y-4">
        {state.ok && <Alert variant="success">Parámetros guardados. Los cálculos se han actualizado.</Alert>}
        {state.error && <Alert variant="danger">{state.error}</Alert>}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Coste pulsera NEGRA en blanco (€)" name="costBlack" value={initialValues.costBlack}
            hint="Lo que te cuesta comprar cada pulsera negra sin grabar." />
          <Field label="Coste pulsera ROJA en blanco (€)" name="costRed" value={initialValues.costRed}
            hint="Lo que te cuesta comprar cada pulsera roja sin grabar." />
          <Field label="Coste de grabado por pulsera (€)" name="costEngraving" value={initialValues.costEngraving}
            hint="Electricidad + consumibles + mantenimiento por cada grabado." />
          <Field label="Coste real de envío por pedido (€)" name="costShipping" value={initialValues.costShipping}
            hint="Lo que pagas TÚ a Correos por envío (distinto de lo que cobras)." />
          <Field label="Tu comisión por pulsera grabada (€)" name="commission" value={initialValues.commission}
            hint="Lo que ganas tú por cada pulsera que grabas." highlight />
        </div>

        <div className="pt-3 border-t border-ink-100">
          <h4 className="text-xs font-semibold text-ink-700 uppercase tracking-wider mb-3">Amortización de la máquina</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Precio de la máquina láser (€)" name="machinePrice" value={initialValues.machinePrice}
              hint="Lo que te costó la máquina (para calcular cuándo se paga sola)." />
            <Field label="Pulseras de vida útil estimada" name="machineLife" value={initialValues.machineLife}
              step={100} integer hint="Nº de pulseras que estimas grabar en toda la vida de la máquina." />
          </div>
          <p className="mt-2 text-[11px] text-ink-500">
            Coste de amortización por pulsera = precio máquina ÷ pulseras de vida.
            Ej: 2.000 € ÷ 20.000 pulseras = 0,10 € por pulsera.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <SubmitBtn />
        </div>
      </form>
    </details>
  );
}

function Field({
  label, name, value, hint, step = 0.01, integer = false, highlight = false,
}: {
  label: string; name: string; value: number; hint?: string;
  step?: number; integer?: boolean; highlight?: boolean;
}) {
  return (
    <div className={highlight ? 'rounded-lg border border-emerald-200 bg-emerald-50/40 p-2 -m-2' : ''}>
      <label className="label text-xs" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="number"
        min={0}
        step={integer ? 1 : step}
        defaultValue={value}
        className="input text-sm"
      />
      {hint && <p className="mt-1 text-[10px] text-ink-400">{hint}</p>}
    </div>
  );
}
