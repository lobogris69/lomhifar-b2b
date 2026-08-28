'use client';

import Link from 'next/link';
import { useState, useTransition, useRef } from 'react';
import { Edit, Power, Trash2, X, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toggleCustomerActive, deleteCustomer, bulkDeleteCustomers, bulkDeactivateCustomers } from './actions';

interface Customer {
  id: string;
  cif: string;
  email: string;
  pharmacyName: string;
  isTest?: boolean;
  city: string | null;
  province: string | null;
  source: string;
  active: boolean;
  createdAt: Date;
}

export function BulkSelectTable({ customers }: { customers: Customer[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmMode, setConfirmMode] = useState<'delete' | 'deactivate' | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const allSelected = customers.length > 0 && customers.every((c) => selected.has(c.id));
  const someSelected = selected.size > 0;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(customers.map((c) => c.id)));
  }

  function clearSelection() {
    setSelected(new Set());
    setConfirmMode(null);
    setResult(null);
  }

  function executeBulk() {
    if (!confirmMode) return;
    const fd = new FormData();
    selected.forEach((id) => fd.append('ids', id));
    startTransition(async () => {
      const action = confirmMode === 'delete' ? bulkDeleteCustomers : bulkDeactivateCustomers;
      const r = await action({}, fd);
      if (r.error) {
        setResult(`Error: ${r.error}`);
      } else if (r.ok) {
        const parts: string[] = [];
        if (r.deleted) parts.push(`${r.deleted} eliminados`);
        if (r.deactivatedInstead) {
          parts.push(
            confirmMode === 'delete'
              ? `${r.deactivatedInstead} desactivados (tenían pedidos y no se pueden borrar)`
              : `${r.deactivatedInstead} desactivados`,
          );
        }
        setResult(parts.join(', '));
        setSelected(new Set());
        setConfirmMode(null);
      }
    });
  }

  return (
    <>
      {/* Toolbar flotante cuando hay seleccionados */}
      {someSelected && !confirmMode && (
        <div className="sticky top-0 z-20 mb-3 -mt-2 bg-ink-900 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearSelection}
              className="hover:bg-white/10 p-1 rounded"
              aria-label="Limpiar selección"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium">
              {selected.size.toLocaleString('es-ES')} cliente{selected.size === 1 ? '' : 's'} seleccionado{selected.size === 1 ? '' : 's'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfirmMode('deactivate')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 text-sm font-medium flex items-center gap-1.5"
            >
              <Power className="h-3.5 w-3.5" /> Desactivar
            </button>
            <button
              type="button"
              onClick={() => setConfirmMode('delete')}
              className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {confirmMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft">
            <div className="flex items-start gap-3 mb-4">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${confirmMode === 'delete' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-ink-900">
                  {confirmMode === 'delete' ? 'Eliminar' : 'Desactivar'} {selected.size} cliente{selected.size === 1 ? '' : 's'}
                </h3>
                <p className="mt-1 text-sm text-ink-600">
                  {confirmMode === 'delete' ? (
                    <>
                      Se eliminarán <strong>permanentemente</strong> de la base de datos.
                      Los clientes con pedidos asociados se <strong>desactivarán</strong> en su lugar
                      (no se pueden borrar para no romper el histórico de pedidos).
                      <br /><br />
                      Esta acción <strong>no se puede deshacer</strong>.
                    </>
                  ) : (
                    <>
                      Se marcarán como inactivos y <strong>no podrán hacer login</strong>.
                      Puedes reactivarlos en cualquier momento desde su ficha.
                    </>
                  )}
                </p>
              </div>
            </div>

            {result && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
                {result}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmMode(null)}
                disabled={isPending}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeBulk}
                disabled={isPending}
                className={confirmMode === 'delete' ? 'btn-danger' : 'btn-primary'}
              >
                {isPending ? 'Procesando…' : (confirmMode === 'delete' ? 'Sí, eliminar' : 'Sí, desactivar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {result && !confirmMode && (
        <div className="mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center justify-between">
          <span>✓ {result}</span>
          <button onClick={() => setResult(null)} className="text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table-pro">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-ink-300"
                  aria-label="Seleccionar todos"
                />
              </th>
              <th>Farmacia</th>
              <th>CIF</th>
              <th>Email</th>
              <th>Localidad</th>
              <th>Origen</th>
              <th>Estado</th>
              <th>Alta</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className={selected.has(c.id) ? 'bg-brand-50/30' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4 rounded border-ink-300"
                    aria-label={`Seleccionar ${c.pharmacyName}`}
                  />
                </td>
                <td className="font-medium">
                  {c.pharmacyName}
                  {/* Que no se confunda con una farmacia real de un vistazo. */}
                  {c.isTest && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 align-middle">
                      PRUEBA
                    </span>
                  )}
                </td>
                <td className="font-mono">{c.cif}</td>
                <td>{c.email || <span className="text-ink-400 italic">sin email</span>}</td>
                <td>{[c.city, c.province].filter(Boolean).join(', ') || '—'}</td>
                <td>
                  <span className="badge-muted text-[10px]">
                    {c.source === 'EXCEL' ? 'Excel' : c.source === 'APPLICATION' ? 'Alta web' : 'Manual'}
                  </span>
                </td>
                <td>
                  {c.active ? (
                    <span className="badge-success">Activo</span>
                  ) : (
                    <span className="badge-danger">Inactivo</span>
                  )}
                </td>
                <td className="text-ink-500 text-xs">{formatDate(c.createdAt)}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/clientes/${c.id}`} className="btn-ghost" title="Editar">
                      <Edit className="h-3.5 w-3.5" />
                    </Link>
                    <form action={toggleCustomerActive}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="btn-ghost" title={c.active ? 'Desactivar' : 'Activar'}>
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <form action={deleteCustomer}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="btn-ghost text-danger" title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
