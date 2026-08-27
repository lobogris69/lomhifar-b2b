'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useMemo, useState } from 'react';
import { Loader2, NotebookPen, Plus, Trash2, Save, UserPlus, Info } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import {
  createManualOrder, quickCreateCustomer,
  type CreateManualOrderState, type QuickCustomerState,
} from './actions';
import { CHANNEL_LABEL } from './channels';

interface CustomerLite {
  id: string;
  cif: string;
  pharmacyName: string;
  email: string;
  city?: string | null;
  active: boolean;
}

interface Props {
  customers: CustomerLite[];
  maxCharsPerLine: number;
}

interface ItemDraft {
  color: 'BLACK' | 'RED';
  quantity: number;
  line1: string;
  line2: string;
  line3: string;
}

const initialOrder: CreateManualOrderState = {};
const initialQC: QuickCustomerState = {};
const CHANNELS: Array<keyof typeof CHANNEL_LABEL> =
  ['PHONE', 'EMAIL', 'WHATSAPP', 'VISIT', 'NOTE', 'OTHER'];

function GuardarPedido({ puedeGuardar }: { puedeGuardar: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!puedeGuardar || pending}
      className="btn-primary disabled:opacity-40"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Guardando…' : 'Guardar pedido'}
    </button>
  );
}

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Guardando…' : label}
    </button>
  );
}

export function ManualOrderForm({ customers, maxCharsPerLine }: Props) {
  const [state, action] = useFormState(createManualOrder, initialOrder);
  const [qcState, qcAction] = useFormState(quickCreateCustomer, initialQC);

  // Modo talonario: pedido en papel de una farmacia que NO es clienta. No se
  // elige cliente (van todos al genérico de mostrador); se teclea el nombre
  // que venga escrito en la nota.
  const [modoTalonario, setModoTalonario] = useState(false);
  const [talonarioFarmacia, setTalonarioFarmacia] = useState('');
  const [talonarioRef, setTalonarioRef] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [items, setItems] = useState<ItemDraft[]>([
    { color: 'BLACK', quantity: 1, line1: '', line2: '', line3: '' },
  ]);
  const [channel, setChannel] = useState<keyof typeof CHANNEL_LABEL>('PHONE');
  const [notify, setNotify] = useState(true);
  const [isTest, setIsTest] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Al dar de alta una farmacia desde aquí, se selecciona sola. Pero UNA vez:
  // `qcState` no se reinicia nunca, así que comparando contra la selección
  // actual el bloque saltaba en cada pintado y devolvía la selección a la
  // recién creada en cuanto se elegía otra farmacia. No había forma de
  // cambiarla sin recargar la página.
  const [altaYaAplicada, setAltaYaAplicada] = useState<string | null>(null);
  if (qcState.ok && qcState.customerId && qcState.customerId !== altaYaAplicada) {
    setAltaYaAplicada(qcState.customerId);
    setSelectedCustomerId(qcState.customerId);
    setShowQuickCreate(false);
  }

  const currentList: CustomerLite[] = useMemo(() => {
    // Añadimos "on the fly" el cliente recién creado si no está en la lista (SSR)
    let list = customers;
    if (qcState.ok && qcState.customerId && !customers.find((c) => c.id === qcState.customerId)) {
      list = [...customers, {
        id: qcState.customerId,
        cif: 'Nuevo',
        pharmacyName: '(recién creado)',
        email: '',
        active: true,
      }];
    }
    const q = search.trim().toLowerCase();
    if (!q) return list.slice(0, 100);
    return list.filter((c) =>
      c.cif.toLowerCase().includes(q)
      || c.pharmacyName.toLowerCase().includes(q)
      || (c.city ?? '').toLowerCase().includes(q)
      || c.email.toLowerCase().includes(q),
    ).slice(0, 100);
  }, [customers, search, qcState]);

  const selectedCustomer = currentList.find((c) => c.id === selectedCustomerId)
    ?? customers.find((c) => c.id === selectedCustomerId);

  const clienteListo = modoTalonario
    ? talonarioFarmacia.trim().length > 0
    : Boolean(selectedCustomerId);
  const canSubmit = clienteListo && items.length > 0
    && items.every((it) => it.line1.trim().length > 0 && it.quantity >= 1);

  function updateItem(idx: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }
  function addItem() {
    setItems((prev) => [...prev, { color: 'BLACK', quantity: 1, line1: '', line2: '', line3: '' }]);
  }

  return (
    <div className="space-y-6">
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      {/* Selector de cliente */}
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-ink-900 mb-1">1. Cliente (farmacia)</h2>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setModoTalonario(false)}
            className={modoTalonario ? 'btn-ghost text-xs' : 'btn-secondary text-xs'}
          >
            Farmacia registrada
          </button>
          <button
            type="button"
            onClick={() => setModoTalonario(true)}
            className={modoTalonario ? 'btn-secondary text-xs' : 'btn-ghost text-xs'}
          >
            <NotebookPen className="h-3.5 w-3.5" /> Pedido de talonario
          </button>
        </div>

        {modoTalonario ? (
          <>
            <p className="text-xs text-ink-500 mb-3">
              Para pedidos en papel de farmacias que no son clientas. No hace falta
              darlas de alta: el pedido guarda el nombre que venga escrito, descuenta
              stock y cuenta en el panel de negocio igual que cualquier otro.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className="label text-xs" htmlFor="talonarioFarmacia">
                  Nombre de la farmacia *
                </label>
                <input
                  id="talonarioFarmacia"
                  value={talonarioFarmacia}
                  onChange={(e) => setTalonarioFarmacia(e.target.value)}
                  placeholder="tal como venga en la nota"
                  className="input"
                />
                {state.fieldErrors?.talonarioFarmacia && (
                  <p className="field-error">{state.fieldErrors.talonarioFarmacia}</p>
                )}
              </div>
              <div>
                <label className="label text-xs" htmlFor="talonarioRef">
                  Nº de talonario
                </label>
                <input
                  id="talonarioRef"
                  value={talonarioRef}
                  onChange={(e) => setTalonarioRef(e.target.value)}
                  placeholder="para poder localizar el papel"
                  className="input"
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-ink-400">
              Si esta farmacia se hace clienta más adelante, la das de alta entonces:
              estos pedidos siguen guardados a su nombre.
            </p>
          </>
        ) : (
        <>
        <p className="text-xs text-ink-500 mb-3">
          Busca por CIF, nombre, ciudad o email. Si la farmacia no está registrada,
          usa &laquo;Crear cliente rápido&raquo; para darla de alta en 30 segundos.
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <input
            type="text"
            placeholder="Buscar farmacia…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1 min-w-[240px]"
          />
          <button
            type="button"
            onClick={() => setShowQuickCreate((s) => !s)}
            className="btn-secondary text-sm"
          >
            <UserPlus className="h-4 w-4" /> {showQuickCreate ? 'Cancelar alta' : 'Crear cliente rápido'}
          </button>
        </div>

        {showQuickCreate && (
          <form action={qcAction} className="rounded-lg border border-brand-200 bg-brand-50/40 p-4 mb-3 space-y-2">
            {qcState.error && <Alert variant="danger">{qcState.error}</Alert>}
            <div className="grid sm:grid-cols-2 gap-2">
              <input name="cif" placeholder="CIF/NIF *" className="input" required />
              <input name="pharmacyName" placeholder="Nombre de la farmacia *" className="input" required />
              <input name="email" type="email" placeholder="Email *" className="input" required />
              <input name="contactName" placeholder="Persona de contacto" className="input" />
              <input name="phone" placeholder="Teléfono" className="input" />
              <input name="postalCode" placeholder="CP" className="input" />
              <input name="city" placeholder="Ciudad" className="input" />
              <input name="province" placeholder="Provincia" className="input" />
              <input name="address" placeholder="Dirección" className="input sm:col-span-2" />
            </div>
            {qcState.fieldErrors && (
              <p className="text-xs text-danger">
                {Object.values(qcState.fieldErrors).join(' · ')}
              </p>
            )}
            <SubmitBtn label="Dar de alta cliente" />
          </form>
        )}

        {currentList.length === 0 ? (
          <div className="text-xs text-ink-500 py-4 text-center border border-dashed border-ink-200 rounded">
            No hay clientes que coincidan. Prueba con menos texto o crea uno nuevo.
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto border border-ink-200 rounded-lg divide-y divide-ink-100">
            {currentList.map((c) => (
              <label
                key={c.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
                  selectedCustomerId === c.id ? 'bg-brand-50' : 'hover:bg-ink-50'
                }`}
              >
                <input
                  type="radio"
                  name="customerRadio"
                  checked={selectedCustomerId === c.id}
                  onChange={() => setSelectedCustomerId(c.id)}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-900 truncate">
                    {c.pharmacyName}
                    {!c.active && <span className="ml-2 text-[10px] text-danger">(desactivado)</span>}
                  </div>
                  <div className="text-[11px] text-ink-500 truncate">
                    {c.cif} · {c.email} {c.city ? `· ${c.city}` : ''}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {selectedCustomer && (
          <div className="mt-3 text-xs text-ink-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
            <strong>Seleccionado:</strong> {selectedCustomer.pharmacyName} · {selectedCustomer.cif}
          </div>
        )}
        </>
        )}
      </section>

      {/* Editor de líneas */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-ink-900">2. Pulseras del pedido</h2>
          <button type="button" onClick={addItem} className="btn-secondary text-xs">
            <Plus className="h-3.5 w-3.5" /> Añadir pulsera
          </button>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-lg border border-ink-200 p-3 bg-white">
              <div className="grid sm:grid-cols-[100px,90px,1fr,32px] gap-2 items-start">
                <div>
                  <label className="text-[10px] uppercase text-ink-500">Color</label>
                  <select
                    value={it.color}
                    onChange={(e) => updateItem(idx, { color: e.target.value as 'BLACK' | 'RED' })}
                    className="input text-sm"
                  >
                    <option value="BLACK">Negra</option>
                    <option value="RED">Roja</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-ink-500">Uds</label>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Math.max(1, Math.min(9999, Number(e.target.value) || 1)) })}
                    className="input text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Línea 1 *"
                    maxLength={maxCharsPerLine}
                    value={it.line1}
                    onChange={(e) => updateItem(idx, { line1: e.target.value })}
                    className="input text-sm tracking-wide"
                  />
                  <input
                    type="text"
                    placeholder="Línea 2 (opcional)"
                    maxLength={maxCharsPerLine}
                    value={it.line2}
                    onChange={(e) => updateItem(idx, { line2: e.target.value })}
                    className="input text-sm tracking-wide"
                  />
                  <input
                    type="text"
                    placeholder="Línea 3 (opcional)"
                    maxLength={maxCharsPerLine}
                    value={it.line3}
                    onChange={(e) => updateItem(idx, { line3: e.target.value })}
                    className="input text-sm tracking-wide"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="btn-ghost text-danger disabled:opacity-30"
                  title="Quitar esta pulsera"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-ink-500">
          <Info className="h-3 w-3 inline mr-1" />
          Máximo {maxCharsPerLine} caracteres por línea.
          Los precios y descuentos por volumen se calculan automáticamente al guardar.
        </p>
      </section>

      {/* Formulario real que se envía */}
      <form action={action} className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-ink-900">3. Origen del pedido y notas</h2>

        <input type="hidden" name="customerId" value={modoTalonario ? '' : selectedCustomerId} />
        {modoTalonario && (
          <>
            <input type="hidden" name="talonario" value="on" />
            <input type="hidden" name="talonarioFarmacia" value={talonarioFarmacia} />
            <input type="hidden" name="talonarioRef" value={talonarioRef} />
          </>
        )}
        <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
        {isTest && <input type="hidden" name="isTest" value="on" />}

        {/* Modo prueba */}
        <label className="flex items-start gap-2 cursor-pointer rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <input
            type="checkbox"
            checked={isTest}
            onChange={(e) => setIsTest(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span className="text-sm">
            <span className="font-semibold text-amber-900">🧪 Pedido de PRUEBA</span>
            <br />
            <span className="text-[11px] text-amber-800">
              No descuenta stock y los emails (interno y confirmación) se envían
              a <strong>tu correo de admin</strong>, no al cliente. Ideal para
              comprobar que todo el flujo funciona y que el archivo láser se
              genera bien. Se pueden borrar en bloque desde Sistema.
            </span>
          </span>
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label text-xs" htmlFor="channel">Canal de entrada del pedido *</label>
            <select
              id="channel"
              name="channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as keyof typeof CHANNEL_LABEL)}
              className="input"
            >
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>{CHANNEL_LABEL[ch]}</option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-ink-400">
              Se guarda para poder ver estadísticas por canal en el futuro.
            </p>
          </div>

          <div className="sm:pt-6">
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                name="notify"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <span className="font-medium text-ink-900">Enviar email de confirmación al cliente</span>
                <br />
                <span className="text-[11px] text-ink-500">
                  Si ya se lo dijiste por teléfono, puedes desmarcar para no molestar.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="label text-xs" htmlFor="adminNote">Nota interna (opcional)</label>
          <textarea
            id="adminNote"
            name="adminNote"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ej: Pedido tomado por Juan en visita comercial · A recoger antes del viernes"
            className="input text-sm"
          />
        </div>

        {state.fieldErrors && (
          <p className="text-xs text-danger">
            {Object.values(state.fieldErrors).join(' · ')}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-ink-100 gap-3 flex-wrap">
          <div className="text-xs text-ink-500">
            {items.length} línea{items.length === 1 ? '' : 's'} de pulseras ·{' '}
            {items.reduce((a, b) => a + b.quantity, 0)} uds totales
          </div>
          {/* Con `disabled={!canSubmit}` a secas el botón seguía vivo mientras
              se guardaba, y la acción tarda (precios, alta y dos correos): daba
              tiempo de sobra a pulsar dos veces y crear el pedido dos veces. */}
          <GuardarPedido puedeGuardar={canSubmit} />
        </div>
      </form>
    </div>
  );
}
