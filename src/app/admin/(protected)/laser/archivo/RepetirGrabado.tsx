'use client';

import { useState } from 'react';
import { Repeat } from 'lucide-react';

/**
 * Repetir un grabado del histórico eligiendo cuántas pulseras.
 *
 * Descarga el MISMO dibujo con la cantidad cambiada en el nombre, que es de
 * donde el puente de la grabadora saca cuántas hacer: graba una, espera al
 * pedal y repite.
 *
 * Los dos casos de uso son distintos y por eso se elige el número:
 *   - salió mal una  -> repetir 1
 *   - la farmacia pide más -> repetir las que sean
 */
export function RepetirGrabado({
  fileId,
  unidadesOriginales,
}: {
  fileId: string;
  unidadesOriginales: number;
}) {
  const [n, setN] = useState(1);

  return (
    <div className="inline-flex items-center gap-1">
      <input
        type="number"
        min={1}
        max={999}
        value={n}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) setN(Math.max(1, Math.min(999, Math.round(v))));
        }}
        className="input h-8 w-14 text-xs text-center px-1 py-0"
        aria-label="Unidades a repetir"
        title={
          unidadesOriginales > 1
            ? `El pedido original llevaba ${unidadesOriginales} unidades`
            : 'Unidades a grabar'
        }
      />
      <a
        href={`/api/admin/laser/file/${fileId}?units=${n}`}
        className="btn-ghost text-xs whitespace-nowrap"
        title={`Descargar de nuevo para grabar ${n} unidad${n === 1 ? '' : 'es'}`}
      >
        <Repeat className="h-3.5 w-3.5" /> Repetir
      </a>
    </div>
  );
}
