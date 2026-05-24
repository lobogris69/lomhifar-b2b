'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { BraceletPhoto } from '@/components/shop/BraceletPhoto';
import type { PrintArea } from '@/lib/settings';
import { saveBraceletAreas, type SaveAreaState } from './actions';

const initial: SaveAreaState = {};

interface Props {
  initialBlack: PrintArea;
  initialRed: PrintArea;
  photoBlackUrl: string | null;
  photoRedUrl: string | null;
}

const DEFAULT_AREA: PrintArea = {
  leftPct: 38, topPct: 44, widthPct: 24, heightPct: 10, rotationDeg: 0, textColor: '#3a3a3e',
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Guardando…' : 'Guardar áreas de impresión'}
    </button>
  );
}

export function AreaEditor({ initialBlack, initialRed, photoBlackUrl, photoRedUrl }: Props) {
  const [state, action] = useFormState(saveBraceletAreas, initial);
  const [black, setBlack] = useState<PrintArea>(initialBlack);
  const [red, setRed] = useState<PrintArea>(initialRed);
  const [sampleLine1, setSampleLine1] = useState('DIABETES TIPO 1');
  const [sampleLine2, setSampleLine2] = useState('TFNO 666 123 456');

  return (
    <form action={action} className="space-y-8">
      {state.ok && (
        <Alert variant="success">Áreas guardadas. Recarga el configurador para verlas en vivo.</Alert>
      )}
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <div className="card p-5">
        <div className="text-sm font-semibold text-ink-900 mb-2">
          Texto de ejemplo (no se guarda)
        </div>
        <p className="text-xs text-ink-500 mb-3">
          Usa cualquier texto para ver cómo queda. Lo que escriban tus clientes en el
          configurador se renderiza igual.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="sl1">Línea 1</label>
            <input
              id="sl1"
              type="text"
              value={sampleLine1}
              onChange={(e) => setSampleLine1(e.target.value.slice(0, 20))}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="sl2">Línea 2</label>
            <input
              id="sl2"
              type="text"
              value={sampleLine2}
              onChange={(e) => setSampleLine2(e.target.value.slice(0, 20))}
              className="input"
            />
          </div>
        </div>
      </div>

      <BraceletAreaPanel
        title="Pulsera NEGRA"
        photoUrl={photoBlackUrl}
        prefix="black"
        area={black}
        setArea={setBlack}
        sampleLine1={sampleLine1}
        sampleLine2={sampleLine2}
      />

      <BraceletAreaPanel
        title="Pulsera ROJA"
        photoUrl={photoRedUrl}
        prefix="red"
        area={red}
        setArea={setRed}
        sampleLine1={sampleLine1}
        sampleLine2={sampleLine2}
      />

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}

function BraceletAreaPanel({
  title,
  photoUrl,
  prefix,
  area,
  setArea,
  sampleLine1,
  sampleLine2,
}: {
  title: string;
  photoUrl: string | null;
  prefix: 'black' | 'red';
  area: PrintArea;
  setArea: (a: PrintArea) => void;
  sampleLine1: string;
  sampleLine2: string;
}) {
  function update(k: keyof PrintArea, v: number | string) {
    setArea({ ...area, [k]: v });
  }
  function reset() {
    setArea(DEFAULT_AREA);
  }

  return (
    <fieldset className="card p-6">
      <legend className="text-base font-semibold text-ink-900 px-2 -ml-2 mb-4">{title}</legend>

      {!photoUrl ? (
        <Alert variant="warning">
          Aún no has subido foto para esta pulsera. Sube primero la imagen en{' '}
          <a href="/admin/imagenes" className="underline font-semibold">/admin/imagenes</a>
          {' '}(slot &laquo;{prefix === 'black' ? 'Pulsera NEGRA' : 'Pulsera ROJA'} (foto real configurador)&raquo;).
          Mientras tanto, en el configurador se sigue mostrando el dibujo SVG.
        </Alert>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* PREVIEW EN VIVO */}
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
              Vista previa (área marcada con guías)
            </div>
            <div className="border border-ink-200 rounded-xl overflow-hidden bg-ink-50/40 p-3">
              <BraceletPhoto
                imageUrl={photoUrl}
                area={area}
                line1={sampleLine1}
                line2={sampleLine2}
                showArea
              />
            </div>
            <p className="mt-2 text-[11px] text-ink-500 leading-relaxed">
              La caja punteada magenta indica el área dentro de la cual se grabará el
              texto. Ajusta los valores hasta que coincida con la placa real de la foto.
            </p>
          </div>

          {/* CONTROLES */}
          <div className="space-y-3">
            <RangeInput
              label="Posición horizontal (left)"
              suffix="%"
              name={`${prefix}_leftPct`}
              value={area.leftPct}
              min={0}
              max={100}
              step={0.5}
              onChange={(v) => update('leftPct', v)}
            />
            <RangeInput
              label="Posición vertical (top)"
              suffix="%"
              name={`${prefix}_topPct`}
              value={area.topPct}
              min={0}
              max={100}
              step={0.5}
              onChange={(v) => update('topPct', v)}
            />
            <RangeInput
              label="Ancho del área"
              suffix="%"
              name={`${prefix}_widthPct`}
              value={area.widthPct}
              min={5}
              max={80}
              step={0.5}
              onChange={(v) => update('widthPct', v)}
            />
            <RangeInput
              label="Alto del área"
              suffix="%"
              name={`${prefix}_heightPct`}
              value={area.heightPct}
              min={2}
              max={50}
              step={0.5}
              onChange={(v) => update('heightPct', v)}
            />
            <RangeInput
              label="Rotación"
              suffix="°"
              name={`${prefix}_rotationDeg`}
              value={area.rotationDeg}
              min={-45}
              max={45}
              step={0.5}
              onChange={(v) => update('rotationDeg', v)}
            />

            <div>
              <label className="label" htmlFor={`${prefix}_textColor`}>
                Color del grabado (láser)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${prefix}_textColor`}
                  name={`${prefix}_textColor`}
                  type="color"
                  value={area.textColor}
                  onChange={(e) => update('textColor', e.target.value)}
                  className="h-10 w-14 rounded border border-ink-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={area.textColor}
                  onChange={(e) => update('textColor', e.target.value)}
                  className="input font-mono w-32"
                  pattern="^#[0-9a-fA-F]{6}$"
                />
                <span className="text-xs text-ink-500">
                  Sugerencia: antracita <code>#3a3a3e</code> para láser sobre aluminio.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={reset}
              className="btn-ghost text-xs"
            >
              <RotateCcw className="h-3 w-3" /> Restaurar valores por defecto
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}

function RangeInput({
  label, suffix, name, value, min, max, step, onChange,
}: {
  label: string;
  suffix: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0" htmlFor={name}>{label}</label>
        <span className="text-xs font-mono text-ink-700">
          {value.toFixed(1)}{suffix}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-brand-600"
        />
        <input
          id={name}
          name={name}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input w-20 text-right text-xs"
        />
      </div>
    </div>
  );
}
