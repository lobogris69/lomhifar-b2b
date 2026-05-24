'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Plus, Minus } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { adjustStock, type AdjustStockState } from './actions';

const initial: AdjustStockState = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Aplicando…' : label}
    </button>
  );
}

export function AdjustStockForm({ color }: { color: 'BLACK' | 'RED' }) {
  const [state, action] = useFormState(adjustStock, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="color" value={color} />

      {state.color === color && state.error && <Alert variant="danger">{state.error}</Alert>}
      {state.color === color && state.ok && <Alert variant="success">Stock actualizado.</Alert>}

      <div>
        <label className="label" htmlFor={`delta-${color}`}>Cantidad (positivo entrada, negativo salida)</label>
        <input
          id={`delta-${color}`}
          name="delta"
          type="number"
          required
          placeholder="ej. +500"
          className="input font-mono text-center text-lg"
        />
      </div>

      <div>
        <label className="label" htmlFor={`reason-${color}`}>Motivo</label>
        <select id={`reason-${color}`} name="reason" required defaultValue="COMPRA" className="input">
          <option value="COMPRA">Entrada (compra a proveedor)</option>
          <option value="DEVOLUCION">Entrada (devolución cliente)</option>
          <option value="AJUSTE">Ajuste de inventario</option>
          <option value="MERMA">Salida por merma / rotura</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`note-${color}`}>Nota interna</label>
        <input
          id={`note-${color}`}
          name="note"
          placeholder="ej. Albarán #12345"
          className="input"
        />
      </div>

      <Submit label="Aplicar movimiento" />
    </form>
  );
}
