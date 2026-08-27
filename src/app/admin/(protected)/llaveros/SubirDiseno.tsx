'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Upload } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { subirDiseno, type LlaveroState } from './actions';

const inicial: LlaveroState = {};

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {pending ? 'Preparando el trazado…' : 'Subir y preparar'}
    </button>
  );
}

/**
 * Alta de un diseño. La imagen se vectoriza al subirla, así que el botón
 * tarda unos segundos: por eso avisa de lo que está haciendo.
 */
export function SubirDiseno({ anchoMm, altoMm }: { anchoMm: number; altoMm: number }) {
  const [state, action] = useFormState(subirDiseno, inicial);
  const [archivo, setArchivo] = useState<string>('');

  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {state.mensaje && <Alert variant="success">{state.mensaje}</Alert>}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-ink-700">Nombre del diseño</span>
          <input
            name="nombre"
            className="input mt-1"
            placeholder="Escudo, logo farmacia…"
            maxLength={80}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink-700">Material</span>
          <select name="material" className="input mt-1" defaultValue="SILVER">
            <option value="SILVER">Plateado</option>
            <option value="GOLD">Dorado</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink-700">Unidades a grabar</span>
          <input
            name="unidades"
            type="number"
            min={1}
            max={999}
            defaultValue={1}
            className="input mt-1"
          />
          <span className="text-[11px] text-ink-500">
            Se graba una, espera al pedal, y repite.
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink-700">Imagen del diseño</span>
          <input
            name="imagen"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={(e) => setArchivo(e.target.files?.[0]?.name ?? '')}
            className="mt-1 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-800 file:font-medium"
          />
          <span className="text-[11px] text-ink-500">
            {archivo || 'PNG, JPG o WEBP. Dibujo de trazos, no una fotografía.'}
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Boton />
        <span className="text-[11px] text-ink-500">
          Se encajará entera dentro de {anchoMm} × {altoMm} mm, sin deformarla.
        </span>
      </div>
    </form>
  );
}
