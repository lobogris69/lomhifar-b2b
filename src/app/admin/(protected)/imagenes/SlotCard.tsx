'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRef, useState } from 'react';
import { CheckCircle2, ImageOff, Loader2, RotateCcw, UploadCloud } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { uploadSiteImage, deleteSiteImage, type UploadImageState } from './actions';

interface Props {
  slot: string;
  label: string;
  description: string;
  recommended: string;
  accept: string[];
  aspect: string;
  isCustom: boolean;
  hasImage: boolean;
  filename?: string;
  size?: number;
  updatedAt?: Date;
  hasComponentFallback: boolean;
}

function formatBytes(n?: number): string {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

const initial: UploadImageState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs">
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
      {pending ? 'Subiendo…' : 'Subir'}
    </button>
  );
}

export function SlotCard(props: Props) {
  const [state, action] = useFormState(uploadSiteImage, initial);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cache-busting: timestamp del último upload conocido
  const v = props.updatedAt ? new Date(props.updatedAt).getTime() : 'default';
  const imgSrc = `/api/images/${props.slot}?v=${v}`;

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* PREVIEW */}
      <div className="relative bg-gradient-to-b from-ink-50 to-ink-100 border-b border-ink-100 flex items-center justify-center p-4" style={{ aspectRatio: props.aspect }}>
        {props.hasImage ? (
          <img
            src={imgSrc}
            alt={props.label}
            className="max-w-full max-h-full object-contain"
          />
        ) : props.hasComponentFallback ? (
          <div className="text-center text-xs text-ink-500 px-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700 mb-2">
              <ImageOff className="h-5 w-5" />
            </div>
            <div>Usando renderizado por defecto del componente</div>
          </div>
        ) : (
          <div className="text-center text-xs text-ink-400">Sin imagen disponible</div>
        )}

        {/* Badge estado */}
        <div className="absolute top-3 left-3">
          {props.isCustom ? (
            <span className="badge-brand">Personalizado</span>
          ) : props.hasImage ? (
            <span className="badge-muted">Por defecto</span>
          ) : (
            <span className="badge-warning">Sin imagen</span>
          )}
        </div>
      </div>

      {/* META + ACTIONS */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-ink-900 text-sm">{props.label}</h3>
        <p className="mt-1 text-xs text-ink-500 leading-relaxed">{props.description}</p>
        <p className="mt-2 text-[11px] text-ink-400 italic">{props.recommended}</p>

        {props.isCustom && (
          <div className="mt-3 text-[11px] text-ink-500 space-y-0.5 border-t border-ink-100 pt-2">
            <div className="truncate">📄 {props.filename}</div>
            <div>📦 {formatBytes(props.size)}</div>
          </div>
        )}

        {state.slot === props.slot && state.error && (
          <Alert variant="danger" className="mt-3">
            {state.error}
          </Alert>
        )}
        {state.slot === props.slot && state.ok && (
          <Alert variant="success" className="mt-3">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Imagen actualizada.
            </span>
          </Alert>
        )}

        {/* Upload form */}
        <form action={action} className="mt-4 pt-3 border-t border-ink-100 space-y-2">
          <input type="hidden" name="slot" value={props.slot} />
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept={props.accept.join(',')}
            required
            onChange={(e) => setFilename(e.target.files?.[0]?.name ?? null)}
            className="block w-full text-[11px] text-ink-600 file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border file:border-ink-200 file:bg-white file:text-ink-700 hover:file:border-brand-400 file:cursor-pointer cursor-pointer"
          />
          {filename && <div className="text-[11px] text-ink-700 truncate">{filename}</div>}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <Submit />
            {props.isCustom && (
              <form action={deleteSiteImage}>
                <input type="hidden" name="slot" value={props.slot} />
                <button
                  type="submit"
                  className="btn-ghost text-[11px] text-ink-500 hover:text-danger"
                  title="Restaurar imagen por defecto"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurar default
                </button>
              </form>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
