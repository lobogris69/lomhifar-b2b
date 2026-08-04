'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { saveLaserSettings, type SaveLaserState } from './actions';

const initial: SaveLaserState = {};

interface LaserInitial {
  plateWidthMm: number;
  plateHeightMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  lineHeightFactor: number;
  curveSteps: number;
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </button>
  );
}

/**
 * Formulario admin de configuración del área imprimible + preview
 * en vivo con las medidas EN CURSO (antes de guardar) y con el texto
 * de prueba que teclee el admin.
 *
 * El preview usa el endpoint /api/admin/pedidos/preview-laser?text=...
 * … ojo: no queremos crear un pedido falso. Mejor: preview local en
 * cliente calculando dimensiones (sin fuente real).
 *
 * Aquí hacemos un preview SIMPLIFICADO en cliente: rectángulo de la
 * placa + rectángulo del área imprimible + placeholder del texto.
 * El preview REAL con la fuente Inter Bold ya se puede ver por pedido
 * desde /admin/pedidos/[id] (usa el endpoint del server).
 */
export function LaserSettingsForm({ initialValues }: { initialValues: LaserInitial }) {
  const [state, action] = useFormState(saveLaserSettings, initial);

  // Estado local para el preview en vivo (mientras el admin edita)
  const [plateW, setPlateW] = useState(initialValues.plateWidthMm);
  const [plateH, setPlateH] = useState(initialValues.plateHeightMm);
  const [mL, setML] = useState(initialValues.marginLeftMm);
  const [mR, setMR] = useState(initialValues.marginRightMm);
  const [mT, setMT] = useState(initialValues.marginTopMm);
  const [mB, setMB] = useState(initialValues.marginBottomMm);
  const [factor, setFactor] = useState(initialValues.lineHeightFactor);
  const [curveSteps, setCurveSteps] = useState(initialValues.curveSteps);

  // Reset del preview cuando se guardan los cambios exitosamente
  useEffect(() => {
    if (state.ok) {
      // No hacemos nada especial — los valores locales ya reflejan lo guardado.
    }
  }, [state.ok]);

  const usableW = Math.max(0, plateW - mL - mR);
  const usableH = Math.max(0, plateH - mT - mB);
  const invalidUsable = usableW <= 0.5 || usableH <= 0.5;

  // viewBox visual: placa + 3mm de padding para verla holgada
  const PAD = 3;
  const vbX = -PAD;
  const vbY = -PAD;
  const vbW = plateW + PAD * 2;
  const vbH = plateH + PAD * 2;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Formulario */}
      <form action={action} className="card p-5 space-y-4">
        {state.error && <Alert variant="danger">{state.error}</Alert>}
        {state.ok && <Alert variant="success">Configuración guardada correctamente.</Alert>}

        <section>
          <h3 className="text-sm font-semibold text-ink-900 mb-2">Placa (dimensiones exteriores)</h3>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Ancho (mm)" name="plateWidthMm" value={plateW} onChange={setPlateW} err={state.fieldErrors?.plateWidthMm} />
            <NumField label="Alto (mm)" name="plateHeightMm" value={plateH} onChange={setPlateH} err={state.fieldErrors?.plateHeightMm} />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-ink-900 mb-2">Márgenes (mm)</h3>
          <p className="text-xs text-ink-500 mb-2">
            Espacio de seguridad dentro de la placa donde el láser NO grabará.
            Útil para dejar hueco al símbolo médico ya estampado (aumenta el margen
            izquierdo si la Estrella de la Vida ocupa esa zona).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Izquierda" name="marginLeftMm" value={mL} onChange={setML} err={state.fieldErrors?.marginLeftMm} />
            <NumField label="Derecha" name="marginRightMm" value={mR} onChange={setMR} err={state.fieldErrors?.marginRightMm} />
            <NumField label="Superior" name="marginTopMm" value={mT} onChange={setMT} err={state.fieldErrors?.marginTopMm} />
            <NumField label="Inferior" name="marginBottomMm" value={mB} onChange={setMB} err={state.fieldErrors?.marginBottomMm} />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-ink-900 mb-2">Tipografía</h3>
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Separación líneas ×"
              name="lineHeightFactor"
              value={factor}
              onChange={setFactor}
              step={0.05}
              err={state.fieldErrors?.lineHeightFactor}
              hint="1.25 = 25% de aire entre las 2 filas"
            />
            <NumField
              label="Resolución curvas"
              name="curveSteps"
              value={curveSteps}
              onChange={setCurveSteps}
              step={1}
              err={state.fieldErrors?.curveSteps}
              hint="24 óptimo · 6-64 rango"
            />
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Fuente utilizada: <strong>Roboto Bold</strong> (embebida en el servidor).
            El texto se convierte a trazados vectoriales, así el DXF sale idéntico
            independiente de qué fuentes tenga EZCAD.
          </p>
        </section>

        <div className="pt-2 flex items-center justify-between border-t border-ink-100">
          <div className="text-xs text-ink-500">
            Área útil resultante: <strong className={invalidUsable ? 'text-danger' : 'text-ink-900'}>
              {usableW.toFixed(1)} × {usableH.toFixed(1)} mm
            </strong>
          </div>
          <SubmitBtn />
        </div>
      </form>

      {/* Preview visual (sin fuente real — solo geometría) */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="h-4 w-4 text-brand-700" />
          <h3 className="text-sm font-semibold text-ink-900">Preview de la placa</h3>
        </div>
        <p className="text-xs text-ink-500 mb-3">
          Rectángulo <span className="text-ink-800 font-semibold">gris</span> = placa completa ·
          <span className="text-brand-700 font-semibold"> línea magenta discontinua</span> = área imprimible útil.
          Para ver el texto real grabado, entra a un pedido concreto y abre &laquo;Preview láser&raquo;.
        </p>

        <div className="rounded-lg border border-ink-200 bg-ink-50/40 p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
            style={{ width: '100%', maxHeight: '260px', display: 'block' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Placa */}
            <rect x="0" y="0" width={plateW} height={plateH} fill="#eaeaef" stroke="#a4a4ac" strokeWidth="0.1" />
            {/* Área útil */}
            {!invalidUsable && (
              <rect
                x={mL}
                y={mT}
                width={usableW}
                height={usableH}
                fill="none"
                stroke="#d12686"
                strokeWidth="0.15"
                strokeDasharray="0.5 0.4"
              />
            )}
            {/* Placeholder de texto */}
            {!invalidUsable && (
              <text
                x={mL + usableW / 2}
                y={mT + usableH / 2 + usableH * 0.15}
                textAnchor="middle"
                fontSize={Math.min(usableH * 0.7, usableW / 8)}
                fill="#1a1a20"
                fontFamily="Inter, sans-serif"
                fontWeight="700"
              >
                DIABETES TIPO 1
              </text>
            )}
            {/* Cotas */}
            <text x={plateW / 2} y={-0.8} textAnchor="middle" fontSize={vbW * 0.02} fill="#54545f">{plateW.toFixed(1)}mm</text>
            <text
              x={-0.8}
              y={plateH / 2}
              textAnchor="middle"
              fontSize={vbH * 0.02}
              fill="#54545f"
              transform={`rotate(-90 ${-0.8} ${plateH / 2})`}
            >
              {plateH.toFixed(1)}mm
            </text>
          </svg>
        </div>

        <div className="mt-3 text-[11px] text-ink-500 leading-relaxed">
          <strong>Cómo se usa en tu día a día:</strong> cuando entre un pedido, ve a{' '}
          <code className="bg-ink-100 px-1 rounded">/admin/pedidos/[id]</code>, pulsa
          <strong> «Descargar DXF»</strong> por cada texto único → doble-click en el archivo →
          se abre EZCAD → pulsa F2 → láser dispara.
        </div>
      </div>
    </div>
  );
}

function NumField({
  label,
  name,
  value,
  onChange,
  step = 0.1,
  err,
  hint,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  err?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="label text-xs" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="number"
        step={step}
        min={0}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="input text-sm"
      />
      {hint && !err && <p className="mt-1 text-[10px] text-ink-400">{hint}</p>}
      {err && <p className="field-error">{err}</p>}
    </div>
  );
}
