'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Save, Loader2, Plus, Trash2, Zap, Gauge, Repeat, Waves, Grid3x3 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { saveLaserProfilesAction, type SaveProfilesState } from './actions';
import type { LaserProfile, LaserProfilesConfig } from '@/lib/laser-profiles';

const initial: SaveProfilesState = {};

const COLORES: Array<{ key: string; etiqueta: string; muestra: string }> = [
  { key: 'BLACK', etiqueta: 'Pulsera negra', muestra: '#1a1a20' },
  { key: 'RED', etiqueta: 'Pulsera roja', muestra: '#c0201f' },
];

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Guardando…' : 'Guardar perfiles'}
    </button>
  );
}

/**
 * Editor de perfiles de grabado.
 *
 * Cada material se comporta distinto bajo el láser, así que los parámetros
 * de máquina van por perfil y no sueltos. Al dar de alta un material nuevo
 * se crea su perfil sin tocar los que ya están afinados.
 */
export function LaserProfilesForm({ config }: { config: LaserProfilesConfig }) {
  const [state, action] = useFormState(saveLaserProfilesAction, initial);
  const [perfiles, setPerfiles] = useState<LaserProfile[]>(config.perfiles);
  const [porColor, setPorColor] = useState<Record<string, string>>(config.porColor);

  const set = (i: number, campo: keyof LaserProfile, valor: string | number | boolean) => {
    setPerfiles((prev) => prev.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)));
  };

  const añadir = () => {
    const n = perfiles.length + 1;
    setPerfiles((prev) => [
      ...prev,
      {
        id: '',
        nombre: `Material ${n}`,
        potenciaPct: 70,
        velocidadMmS: 250,
        pasadas: 1,
        frecuenciaKHz: 30,
        relleno: false,
        pasoRellenoMm: 0.05,
        notas: '',
      },
    ]);
  };

  const borrar = (i: number) => {
    if (perfiles.length <= 1) return;
    const quitado = perfiles[i];
    setPerfiles((prev) => prev.filter((_, j) => j !== i));
    // Ningún color puede quedar apuntando a un perfil que ya no existe.
    setPorColor((prev) => {
      const restantes = perfiles.filter((_, j) => j !== i);
      const out = { ...prev };
      for (const c of Object.keys(out)) {
        if (out[c] === quitado.id) out[c] = restantes[0]?.id ?? '';
      }
      return out;
    });
  };

  return (
    <form action={action} className="card p-5 space-y-5">
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {state.ok && <Alert variant="success">Perfiles guardados correctamente.</Alert>}

      <input type="hidden" name="count" value={perfiles.length} />

      <div className="space-y-4">
        {perfiles.map((p, i) => (
          <div key={i} className="rounded-xl border border-ink-100 p-4 space-y-3">
            <input type="hidden" name={`p${i}_id`} value={p.id} />

            <div className="flex items-center gap-2">
              <input
                name={`p${i}_nombre`}
                value={p.nombre}
                onChange={(e) => set(i, 'nombre', e.target.value)}
                className="input text-sm font-medium flex-1"
                placeholder="Nombre del material"
              />
              <button
                type="button"
                onClick={() => borrar(i)}
                disabled={perfiles.length <= 1}
                className="btn-secondary text-sm shrink-0 disabled:opacity-40"
                title={perfiles.length <= 1 ? 'Tiene que quedar al menos un perfil' : 'Borrar perfil'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Campo
                icono={<Zap className="h-3.5 w-3.5" />}
                label="Potencia (%)"
                name={`p${i}_potencia`}
                value={p.potenciaPct}
                step={1}
                onChange={(v) => set(i, 'potenciaPct', v)}
              />
              <Campo
                icono={<Gauge className="h-3.5 w-3.5" />}
                label="Velocidad (mm/s)"
                name={`p${i}_velocidad`}
                value={p.velocidadMmS}
                step={10}
                onChange={(v) => set(i, 'velocidadMmS', v)}
              />
              <Campo
                icono={<Repeat className="h-3.5 w-3.5" />}
                label="Pasadas"
                name={`p${i}_pasadas`}
                value={p.pasadas}
                step={1}
                onChange={(v) => set(i, 'pasadas', v)}
              />
              <Campo
                icono={<Waves className="h-3.5 w-3.5" />}
                label="Frecuencia (kHz)"
                name={`p${i}_frecuencia`}
                value={p.frecuenciaKHz}
                step={1}
                onChange={(v) => set(i, 'frecuenciaKHz', v)}
              />
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  name={`p${i}_relleno`}
                  checked={p.relleno}
                  onChange={(e) => set(i, 'relleno', e.target.checked)}
                />
                <Grid3x3 className="h-3.5 w-3.5" />
                Rellenar las letras
              </label>
              {p.relleno && (
                <div className="w-40">
                  <Campo
                    label="Paso del relleno (mm)"
                    name={`p${i}_paso`}
                    value={p.pasoRellenoMm}
                    step={0.01}
                    onChange={(v) => set(i, 'pasoRellenoMm', v)}
                  />
                </div>
              )}
              {!p.relleno && <input type="hidden" name={`p${i}_paso`} value={p.pasoRellenoMm} />}
            </div>

            <div>
              <label className="label text-xs" htmlFor={`p${i}_notas`}>
                Notas
              </label>
              <input
                id={`p${i}_notas`}
                name={`p${i}_notas`}
                value={p.notas}
                onChange={(e) => set(i, 'notas', e.target.value)}
                className="input text-sm"
                placeholder="Proveedor, referencia, qué tal va…"
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={añadir} className="btn-secondary text-sm">
        <Plus className="h-4 w-4" /> Añadir material
      </button>

      <div className="rounded-xl border border-ink-100 p-4 space-y-3">
        <h3 className="text-sm font-medium text-ink-800">Qué perfil usa cada pulsera</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COLORES.map((c) => (
            <div key={c.key}>
              <label className="label text-xs flex items-center gap-2" htmlFor={`color_${c.key}`}>
                <span
                  className="inline-block h-3 w-3 rounded-full border border-ink-200"
                  style={{ background: c.muestra }}
                />
                {c.etiqueta}
              </label>
              <select
                id={`color_${c.key}`}
                name={`color_${c.key}`}
                value={porColor[c.key] ?? perfiles[0]?.id ?? ''}
                onChange={(e) => setPorColor((prev) => ({ ...prev, [c.key]: e.target.value }))}
                className="input text-sm"
              >
                {perfiles.map((p, i) => (
                  <option key={i} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-400">
          Los perfiles recién añadidos no se pueden asignar hasta guardarlos.
        </p>
      </div>

      <SubmitBtn />
    </form>
  );
}

function Campo({
  label,
  name,
  value,
  onChange,
  step = 1,
  icono,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  icono?: React.ReactNode;
}) {
  return (
    <div>
      <label className="label text-xs flex items-center gap-1.5" htmlFor={name}>
        {icono}
        {label}
      </label>
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
    </div>
  );
}
