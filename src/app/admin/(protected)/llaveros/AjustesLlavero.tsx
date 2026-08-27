'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { ChevronDown, Loader2, Save } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { guardarAjustesLlavero, type LlaveroState } from './actions';

const inicial: LlaveroState = {};

export interface PerfilLite {
  id: string;
  nombre: string;
  potenciaPct: number;
  velocidadMmS: number;
  pasadas: number;
  frecuenciaKHz: number;
  relleno: boolean;
  pasoRellenoMm: number;
  notas: string;
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Guardando…' : 'Guardar ajustes'}
    </button>
  );
}

function Campo({
  etiqueta, nombre, valor, paso = 1, pista,
}: {
  etiqueta: string; nombre: string; valor: number; paso?: number; pista?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-ink-700">{etiqueta}</span>
      <input
        name={nombre}
        type="number"
        step={paso}
        defaultValue={valor}
        className="input mt-0.5 text-sm"
      />
      {pista && <span className="text-[10px] text-ink-500">{pista}</span>}
    </label>
  );
}

/**
 * Zona a grabar y parámetros de máquina de los llaveros.
 *
 * Van aparte de los de las pulseras a propósito: el metal y la silicona no se
 * comportan igual, y lo de las pulseras ya está afinado y comprobado. Tocar
 * aquí no puede estropear aquello.
 */
export function AjustesLlavero({
  anchoMm,
  altoMm,
  perfiles,
}: {
  anchoMm: number;
  altoMm: number;
  perfiles: PerfilLite[];
}) {
  const [state, action] = useFormState(guardarAjustesLlavero, inicial);
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-5 py-4 text-left hover:bg-ink-50/60"
      >
        <div>
          <h2 className="text-sm font-semibold text-ink-900">Ajustes de los llaveros</h2>
          <p className="text-xs text-ink-500">
            Zona a grabar {anchoMm} × {altoMm} mm · potencia y velocidad de cada material
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-ink-500 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <form action={action} className="px-5 pb-5 space-y-5 border-t border-ink-100 pt-4">
          {state.error && <Alert variant="danger">{state.error}</Alert>}
          {state.mensaje && <Alert variant="success">{state.mensaje}</Alert>}

          <section>
            <h3 className="text-xs font-semibold text-ink-900 uppercase tracking-wider mb-2">
              Zona a grabar
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 max-w-md">
              <Campo etiqueta="Ancho (mm)" nombre="anchoMm" valor={anchoMm} paso={0.5} />
              <Campo etiqueta="Alto (mm)" nombre="altoMm" valor={altoMm} paso={0.5} />
            </div>
            <p className="text-[11px] text-ink-500 mt-1.5">
              El dibujo se encaja entero aquí dentro sin deformarse, con 1 mm de aire por
              cada lado. Cambiarlo no toca los diseños ya preparados hasta que los vuelvas
              a aplicar.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-ink-900 uppercase tracking-wider mb-2">
              Parámetros de máquina
            </h3>
            <div className="grid lg:grid-cols-2 gap-4">
              {perfiles.map((p, i) => (
                <div key={p.id} className="rounded-lg border border-ink-200 p-3 space-y-2">
                  <div className="text-sm font-semibold text-ink-900">{p.nombre}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Campo etiqueta="Potencia (%)" nombre={`p${i}_potencia`} valor={p.potenciaPct} />
                    <Campo etiqueta="Velocidad (mm/s)" nombre={`p${i}_velocidad`} valor={p.velocidadMmS} paso={10} />
                    <Campo etiqueta="Pasadas" nombre={`p${i}_pasadas`} valor={p.pasadas} />
                    <Campo etiqueta="Frecuencia (kHz)" nombre={`p${i}_frecuencia`} valor={p.frecuenciaKHz} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-ink-700">
                    <input type="checkbox" name={`p${i}_relleno`} defaultChecked={p.relleno} />
                    Rellenar el dibujo (no solo el contorno)
                  </label>
                  <Campo
                    etiqueta="Separación del relleno (mm)"
                    nombre={`p${i}_paso`}
                    valor={p.pasoRellenoMm}
                    paso={0.01}
                    pista="Más pequeño = más macizo y más lento"
                  />
                  <label className="block">
                    <span className="text-[11px] font-medium text-ink-700">Notas</span>
                    <input
                      name={`p${i}_notas`}
                      defaultValue={p.notas}
                      className="input mt-0.5 text-xs"
                      placeholder="Proveedor, qué tal sale…"
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <Guardar />
        </form>
      )}
    </div>
  );
}
