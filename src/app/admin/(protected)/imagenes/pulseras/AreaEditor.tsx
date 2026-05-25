'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Save, RotateCcw, Move, Sparkles } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { InteractiveBraceletEditor } from './InteractiveBraceletEditor';
import { ENGRAVING_PRESETS, DEFAULT_PRINT_AREA, type PrintArea } from '@/lib/settings';
import { saveBraceletAreas, type SaveAreaState } from './actions';

const initial: SaveAreaState = {};

interface Props {
  initialBlack: PrintArea;
  initialRed: PrintArea;
  photoBlackUrl: string | null;
  photoRedUrl: string | null;
}

// Re-export del default global para que "Restaurar" use SIEMPRE el mismo
// valor que se aplica en la web pública cuando no hay area guardada.
const DEFAULT_AREA: PrintArea = DEFAULT_PRINT_AREA;

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
  const [sampleLine3, setSampleLine3] = useState('');

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
        <div className="grid sm:grid-cols-3 gap-3">
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
          <div>
            <label className="label" htmlFor="sl3">Línea 3</label>
            <input
              id="sl3"
              type="text"
              value={sampleLine3}
              onChange={(e) => setSampleLine3(e.target.value.slice(0, 20))}
              className="input"
              placeholder="(opcional)"
            />
          </div>
        </div>
        <p className="text-[11px] text-ink-500 mt-2">
          El cliente puede grabar 1, 2 o 3 líneas. Prueba aquí cómo se vería cada caso para
          asegurar que el texto cabe en el área.
        </p>
      </div>

      <BraceletAreaPanel
        title="Pulsera NEGRA"
        photoUrl={photoBlackUrl}
        prefix="black"
        area={black}
        setArea={setBlack}
        sampleLine1={sampleLine1}
        sampleLine2={sampleLine2}
        sampleLine3={sampleLine3}
      />

      <BraceletAreaPanel
        title="Pulsera ROJA"
        photoUrl={photoRedUrl}
        prefix="red"
        area={red}
        setArea={setRed}
        sampleLine1={sampleLine1}
        sampleLine2={sampleLine2}
        sampleLine3={sampleLine3}
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
  sampleLine3,
}: {
  title: string;
  photoUrl: string | null;
  prefix: 'black' | 'red';
  area: PrintArea;
  setArea: (a: PrintArea) => void;
  sampleLine1: string;
  sampleLine2: string;
  sampleLine3: string;
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
          {/* EDITOR VISUAL EN VIVO (arrastrable + redimensionable) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-ink-500">
                Editor visual del área
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-brand-700 font-medium">
                <Move className="h-3 w-3" />
                Arrastra y redimensiona
              </span>
            </div>
            <div className="border border-ink-200 rounded-xl overflow-hidden bg-ink-50/40 p-3">
              <InteractiveBraceletEditor
                imageUrl={photoUrl}
                area={area}
                setArea={setArea}
                line1={sampleLine1}
                line2={sampleLine2}
                line3={sampleLine3}
              />
            </div>
            <p className="mt-2 text-[11px] text-ink-500 leading-relaxed">
              <strong className="text-ink-700">Mueve</strong> la caja arrastrándola con el ratón y
              <strong className="text-ink-700"> redimensiona</strong> tirando de las
              4 esquinas. Colócala SOLO sobre el hueco vacío de la placa
              (a la derecha del símbolo médico) para que el texto no se
              superponga al símbolo.
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
              <label className="label flex items-center gap-1.5" htmlFor={`${prefix}_textColor`}>
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                Color del grabado láser
              </label>

              {/* Presets: tonos típicos de grabado láser sobre aluminio sin pintar */}
              <div className="flex flex-wrap gap-2 mb-2">
                {ENGRAVING_PRESETS.map((preset) => {
                  const active = area.textColor.toLowerCase() === preset.value.toLowerCase();
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => update('textColor', preset.value)}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                        active
                          ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20'
                          : 'border-ink-200 hover:border-ink-300 bg-white'
                      }`}
                      title={preset.description}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded border border-ink-300 shadow-inner"
                        style={{ backgroundColor: preset.value }}
                      />
                      <span className="text-ink-800 font-medium">{preset.label}</span>
                    </button>
                  );
                })}
              </div>

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
                  className="input font-mono w-28 text-sm"
                  pattern="^#[0-9a-fA-F]{6}$"
                />
                <span className="text-[11px] text-ink-500 leading-tight">
                  El láser ablaciona el aluminio: no produce negro,
                  sino un gris frostado similar al símbolo médico ya estampado.
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
