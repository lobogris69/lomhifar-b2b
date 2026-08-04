'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { FlaskConical, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { deleteTestOrdersAction, type ResetState } from './actions';

const initial: ResetState = {};

function SubmitBtn({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      className="btn bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 text-sm disabled:opacity-40"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      {pending ? 'Borrando…' : `Borrar ${count} pedido${count === 1 ? '' : 's'} de prueba`}
    </button>
  );
}

/**
 * Tarjeta SEGURA (no requiere escribir BORRAR) para eliminar solo los
 * pedidos marcados como prueba. No toca stock ni pedidos reales.
 */
export function TestOrdersCard({ count }: { count: number }) {
  const [state, action] = useFormState(deleteTestOrdersAction, initial);

  return (
    <div className="card p-6 border-l-4 border-purple-500 bg-purple-50/30">
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical className="h-4 w-4 text-purple-700" />
        <h2 className="text-base font-semibold text-ink-900">
          Borrar pedidos de PRUEBA ({count} actualmente)
        </h2>
      </div>
      <p className="text-sm text-ink-600 mb-3">
        Elimina únicamente los pedidos marcados como prueba (los que creaste con
        la casilla «🧪 Pedido de PRUEBA»). <strong>No toca el stock</strong> (los de
        prueba nunca lo descontaron) ni los pedidos reales. Los archivos láser
        asociados se borran también.
      </p>

      {state.ok && state.testOrdersResult && (
        <Alert variant="success" className="mb-3">
          <CheckCircle2 className="h-4 w-4 inline mr-1" />
          {state.testOrdersResult.deleted} pedido{state.testOrdersResult.deleted === 1 ? '' : 's'} de prueba
          eliminado{state.testOrdersResult.deleted === 1 ? '' : 's'} correctamente.
        </Alert>
      )}
      {state.error && <Alert variant="danger" className="mb-3">{state.error}</Alert>}

      <form action={action}>
        <SubmitBtn count={count} />
      </form>
      {count === 0 && (
        <p className="mt-2 text-xs text-ink-400">No hay pedidos de prueba pendientes de borrar.</p>
      )}
    </div>
  );
}
