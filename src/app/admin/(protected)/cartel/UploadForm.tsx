'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRef, useState } from 'react';
import { Loader2, UploadCloud, FileCheck2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { uploadPoster, type UploadPosterState } from './actions';

const initial: UploadPosterState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
      {pending ? 'Subiendo…' : 'Subir cartel'}
    </button>
  );
}

export function UploadForm() {
  const [state, action] = useFormState(uploadPoster, initial);
  const [filename, setFilename] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {state.ok && (
        <Alert variant="success" title="Cartel subido correctamente">
          Las farmacias ya pueden descargar la nueva versión.
        </Alert>
      )}

      <div className="border-2 border-dashed border-ink-200 rounded-xl p-8 text-center bg-white hover:border-brand-400 transition-colors">
        {filename ? (
          <FileCheck2 className="mx-auto h-10 w-10 text-brand-700 mb-2" />
        ) : (
          <UploadCloud className="mx-auto h-10 w-10 text-brand-700 mb-2" />
        )}
        <input
          ref={ref}
          id="file"
          name="file"
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          required
          onChange={(e) => setFilename(e.target.files?.[0]?.name ?? null)}
          className="block mx-auto text-sm"
        />
        {filename && <p className="mt-3 text-sm text-ink-700">{filename}</p>}
        <p className="mt-3 text-xs text-ink-500">
          Formatos aceptados: PDF, PNG, JPG · máximo 8 MB · A4 recomendado
        </p>
      </div>

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
