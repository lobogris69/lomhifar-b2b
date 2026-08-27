'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState, useTransition } from 'react';
import { CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { commitImport, previewImport, type ImportState } from './actions';

const initial: ImportState = {};

function Btn({ label, busyLabel, className = 'btn-primary' }: { label: string; busyLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
      {pending ? busyLabel : label}
    </button>
  );
}

export function ImportForm() {
  const [previewState, previewAction] = useFormState(previewImport, initial);
  const [commitState, commitAction] = useFormState(commitImport, initial);
  // Guardamos el File en state para que no se pierda cuando el form de preview
  // se desmonta del DOM al pasar a la pantalla de confirmación.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isCommitting, startCommit] = useTransition();
  const [commitError, setCommitError] = useState<string | null>(null);

  const state = commitState.mode === 'committed' ? commitState : previewState;
  const showPreview = previewState.preview && commitState.mode !== 'committed';

  // Wrapper del action de preview que captura el archivo en state antes de invocar
  async function handlePreview(formData: FormData) {
    const file = formData.get('file') as File | null;
    if (file && file.size > 0) setPendingFile(file);
    return previewAction(formData);
  }

  async function handleConfirm(deactivateMissing: boolean) {
    if (!pendingFile) {
      setCommitError('Se perdió la referencia al archivo. Vuelve a empezar la importación.');
      return;
    }
    setCommitError(null);
    const fd = new FormData();
    fd.append('file', pendingFile);
    if (deactivateMissing) fd.append('deactivateMissing', 'on');
    startCommit(() => {
      commitAction(fd);
    });
  }

  return (
    <div className="space-y-6">
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {commitError && <Alert variant="danger">{commitError}</Alert>}

      {!showPreview && commitState.mode !== 'committed' && (
        <form action={handlePreview} className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="file">Archivo Excel (.xlsx, .xls)</label>
            <div className="border-2 border-dashed border-ink-200 rounded-xl p-8 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-brand-700 mb-2" />
              <input
                id="file"
                name="file"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                required
                onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
                className="block mx-auto text-sm"
              />
              {pendingFile && <p className="mt-3 text-sm text-ink-700">{pendingFile.name} ({(pendingFile.size / 1024).toFixed(0)} KB)</p>}
              <p className="mt-3 text-xs text-ink-500">
                Columnas reconocidas: CIF/NIF, Email, Farmacia, Contacto, Teléfono, Dirección, Localidad, CP, Provincia, IBAN, Observaciones, Activo.
              </p>
            </div>
          </div>
          <Btn label="Previsualizar importación" busyLabel="Analizando…" />
        </form>
      )}

      {state.headerErrors && state.headerErrors.length > 0 && (
        <Alert variant="danger" title="El Excel no tiene las columnas mínimas">
          <ul className="list-disc list-inside mt-2 text-sm">
            {state.headerErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </Alert>
      )}

      {showPreview && previewState.preview && (
        <PreviewTable
          rows={previewState.preview}
          fileName={pendingFile?.name ?? ''}
          isCommitting={isCommitting}
          onConfirm={handleConfirm}
        />
      )}

      {commitState.mode === 'committed' && commitState.summary && (
        <ResultSummary summary={commitState.summary} />
      )}
    </div>
  );
}

function PreviewTable({
  rows,
  fileName,
  isCommitting,
  onConfirm,
}: {
  rows: ImportState['preview'] extends infer R ? (R extends undefined ? never : R) : never;
  fileName: string;
  isCommitting: boolean;
  onConfirm: (deactivateMissing: boolean) => void | Promise<void>;
}) {
  const validRows = rows!.filter((r) => r.errors.length === 0);
  const valid = validRows.length;
  const invalid = rows!.length - valid;
  const willBeActive = validRows.filter((r) => r.active).length;
  const willBeInactive = valid - willBeActive;
  const noEmail = validRows.filter((r) => !r.email).length;
  return (
    <div className="space-y-4">
      <Alert variant={invalid > 0 ? 'warning' : 'success'} title="Previsualización">
        <ul className="space-y-0.5 text-sm">
          <li>· <strong>{valid}</strong> farmacias se importarán</li>
          <li>· <strong>{willBeActive}</strong> activas (con email, listas para acceder)</li>
          {willBeInactive > 0 && (
            <li>· <strong>{willBeInactive}</strong> inactivas (sin email o marcadas como BAJA)</li>
          )}
          {noEmail > 0 && (
            <li className="text-xs text-ink-600 italic mt-1">
              ↳ {noEmail} sin email. Quedarán inactivas hasta que añadas el email desde la ficha.
            </li>
          )}
          {invalid > 0 && (
            <li>· <strong>{invalid}</strong> filas con errores que se omitirán (sin CIF o sin nombre)</li>
          )}
        </ul>
      </Alert>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="table-pro">
            <thead className="sticky top-0">
              <tr>
                <th>Fila</th>
                <th>CIF</th>
                <th>Email</th>
                <th>Farmacia</th>
                <th>Localidad</th>
                <th>Activo</th>
                <th>Validación</th>
              </tr>
            </thead>
            <tbody>
              {rows!.map((r) => (
                <tr key={r.rowNumber} className={r.errors.length ? 'bg-red-50/40' : ''}>
                  <td className="text-ink-400">{r.rowNumber}</td>
                  <td className="font-mono">{r.cif || '—'}</td>
                  <td>{r.email || '—'}</td>
                  <td>{r.pharmacyName || '—'}</td>
                  <td>{r.city || '—'}</td>
                  <td>{r.active ? <span className="badge-success">Sí</span> : <span className="badge-muted">No</span>}</td>
                  <td>
                    {r.errors.length === 0 ? (
                      <span className="text-brand-700 inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> OK</span>
                    ) : (
                      <span className="text-danger inline-flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {r.errors.join(', ')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onConfirm(fd.get('deactivateMissing') === 'on');
        }}
        className="card p-5 space-y-3"
      >
        {fileName && (
          <p className="text-xs text-ink-500">
            Archivo a importar: <strong className="text-ink-800">{fileName}</strong>
          </p>
        )}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="deactivateMissing" className="mt-1" disabled={isCommitting} />
          <span>
            <strong>Desactivar clientes ausentes:</strong> marcará como inactivos los clientes (origen Excel) que <em>no</em> aparezcan en este archivo.
          </span>
        </label>
        {isCommitting && (
          <Alert variant="info">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importando… esto puede tardar hasta 1 minuto para listados grandes.
              <strong>No cierres esta pestaña.</strong>
            </span>
          </Alert>
        )}
        <div className="flex justify-end gap-2">
          <a href="/admin/importar" className="btn-secondary" aria-disabled={isCommitting}>
            Cancelar
          </a>
          <button type="submit" className="btn-primary" disabled={isCommitting}>
            {isCommitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isCommitting ? 'Importando…' : 'Confirmar importación'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ResultSummary({ summary }: { summary: NonNullable<ImportState['summary']> }) {
  const seconds = (summary.elapsedMs / 1000).toFixed(1);
  return (
    <div className="space-y-4">
      <Alert variant="success" title={`Importación completada en ${seconds}s`}>
        <div className="grid sm:grid-cols-4 gap-2 mt-1 text-sm">
          <Stat label="Total leídos" value={summary.total} />
          <Stat label="Creados" value={summary.created} highlight />
          <Stat label="Actualizados" value={summary.updated} highlight />
          {summary.deactivated > 0 && <Stat label="Desactivados" value={summary.deactivated} />}
          {summary.skipped > 0 && <Stat label="Omitidos" value={summary.skipped} warning />}
        </div>
      </Alert>
      {/* Se pidió desactivar a los ausentes y no se hizo. Hay que decirlo:
          en silencio, el admin se queda pensando que sí se hizo. */}
      {summary.deactivationSkipped && (
        <Alert variant="warning">{summary.deactivationSkipped}</Alert>
      )}
      {summary.errors.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Filas con errores</h3>
          <ul className="space-y-1 text-sm">
            {summary.errors.map((e, i) => (
              <li key={i}>
                <span className="font-mono text-ink-400 mr-2">fila {e.row}</span>
                <span className="font-mono text-ink-700 mr-2">{e.cif || '—'}</span>
                <span className="text-danger">{e.msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <a href="/admin/clientes" className="btn-primary">Ver clientes</a>
        <a href="/admin/importar" className="btn-secondary">Importar otro archivo</a>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, warning }: { label: string; value: number; highlight?: boolean; warning?: boolean }) {
  return (
    <div className={`rounded p-2 ${highlight ? 'bg-brand-50' : warning ? 'bg-amber-50' : 'bg-white/60'}`}>
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? 'text-brand-800' : warning ? 'text-amber-800' : 'text-ink-900'}`}>{value}</div>
    </div>
  );
}
