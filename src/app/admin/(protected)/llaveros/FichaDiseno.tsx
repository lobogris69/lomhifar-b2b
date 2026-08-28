'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Download, Loader2, Send, Sliders, Trash2, X } from 'lucide-react';
import { useEstadoGrabadora } from '@/components/laser/estado-grabadora';
import { BotonReferencia } from '@/components/laser/BotonReferencia';
import {
  ajustarDiseno,
  borrarDiseno,
  cancelarLlavero,
  enviarLlaveroAGrabadora,
  type LlaveroState,
} from './actions';

const inicial: LlaveroState = {};

export interface DisenoLite {
  id: string;
  nombre: string;
  material: string;
  unidades: number;
  anchoMm: number;
  altoMm: number;
  umbral: number;
  invertido: boolean;
  detalle: string;
  contornos: number;
  size: number;
  tieneVista: boolean;
  creado: string;
  enCola: boolean;
  intentos: number;
  grabado: string | null;
}

function BotonChico({ icono, texto, cargando }: { icono: React.ReactNode; texto: string; cargando: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-secondary text-xs">
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icono}
      {pending ? cargando : texto}
    </button>
  );
}

function BotonEnviar({ lista, yaGrabado }: { lista: boolean; yaGrabado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${lista ? 'btn-primary' : 'btn-secondary'} text-xs`}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      {pending ? 'Enviando…' : yaGrabado ? 'Grabar otra vez' : 'Enviar a la grabadora'}
    </button>
  );
}

/**
 * Un diseño: lo que se va a grabar, cómo se ha preparado y qué se puede hacer
 * con él.
 *
 * La vista previa NO es la imagen que se subió: es el trazado que va a
 * recorrer el láser. Es la diferencia entre creer que va a salir bien y verlo.
 */
export function FichaDiseno({ d }: { d: DisenoLite }) {
  const [ajuste, accionAjustar] = useFormState(ajustarDiseno, inicial);
  const [envio, accionEnviar] = useFormState(enviarLlaveroAGrabadora, inicial);
  const [cancela, accionCancelar] = useFormState(cancelarLlavero, inicial);
  const estado = useEstadoGrabadora();
  const lista = estado?.conectado === true;

  const dorado = d.material === 'GOLD';
  const reintentar = Boolean(envio.error && d.grabado);

  // El umbral tiene que verse mientras se arrastra la barra. Antes el número
  // enseñaba el valor GUARDADO y la barra iba por libre: parecía que moverla
  // no hacía nada.
  const [umbral, setUmbral] = useState(d.umbral);
  const formulario = useRef<HTMLFormElement>(null);
  useEffect(() => { setUmbral(d.umbral); }, [d.umbral]);

  // Al soltar la barra se aplica solo. Tener que acordarse de pulsar otro
  // botón después de mover el control es justo lo que despista.
  const aplicarAlSoltar = () => {
    if (umbral !== d.umbral) formulario.current?.requestSubmit();
  };

  return (
    <div className="rounded-xl border border-ink-200 bg-white overflow-hidden">
      <div className="p-4 grid lg:grid-cols-[minmax(0,320px)_1fr] gap-4">
        {/* Lo que va a salir en el metal */}
        <div className="w-full max-w-[420px]">
          {d.tieneVista ? (
            // Se pide como imagen aparte en vez de venir dentro del HTML: con
            // un dibujo detallado son megas de texto por diseño y el navegador
            // se caía al abrir la lista. El `umbral` va en la dirección para
            // que al reajustar se vuelva a pedir y no salga la de antes.
            <object
              type="image/svg+xml"
              data={`/api/admin/llaveros/${d.id}/vista?u=${d.umbral}&i=${d.invertido ? 1 : 0}&m=${d.material}&d=${d.detalle}&n=${d.contornos}`}
              className="w-full rounded-lg border border-ink-200 overflow-hidden pointer-events-none"
              aria-label={`Trazado de ${d.nombre}`}
            >
              <span className="text-[10px] text-ink-400">Vista previa</span>
            </object>
          ) : (
            <div className="rounded-lg border border-dashed border-ink-300 p-6 text-center text-xs text-ink-500">
              Sin trazado todavía. Ajusta el umbral aquí abajo.
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-500">
            <span>
              {d.contornos} contorno{d.contornos === 1 ? '' : 's'} ·{' '}
              {d.size > 0 ? `${Math.round(d.size / 1024)} KB` : 'sin DXF'}
            </span>
            <span>{d.anchoMm} × {d.altoMm} mm</span>
          </div>
          {d.contornos > 60 && (
            <div className="mt-1 text-[11px] text-amber-700">
              Muchos contornos: el grabado va a tardar. Mueve el umbral hacia la izquierda
              para quedarte solo con los trazos, o usa un dibujo más limpio.
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-ink-900 truncate">{d.nombre}</h3>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: dorado ? '#c9a227' : '#9aa0a6' }}
                >
                  {dorado ? 'Dorado' : 'Plateado'}
                </span>
                <span className="text-[11px] text-ink-500">
                  {d.unidades} ud{d.unidades === 1 ? '' : 's'}
                </span>
              </div>
              <div className="text-[11px] text-ink-500 mt-0.5">
                Subido el {d.creado}
                {d.grabado && ` · grabado el ${d.grabado}`}
              </div>
            </div>

            <form action={borrarDiseno}>
              <input type="hidden" name="id" value={d.id} />
              <button type="submit" className="btn-ghost text-danger text-xs" title="Borrar diseño">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Preparación del dibujo */}
          <form
            ref={formulario}
            action={accionAjustar}
            className="rounded-lg bg-ink-50/60 border border-ink-100 p-3 space-y-2"
          >
            <input type="hidden" name="id" value={d.id} />
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-700 uppercase tracking-wider">
              <Sliders className="h-3.5 w-3.5" /> Preparación del dibujo
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-ink-600">
                  Umbral
                  {umbral !== d.umbral && <em className="text-amber-700"> · sin aplicar</em>}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    name="umbral"
                    type="range"
                    min={20}
                    max={230}
                    step={1}
                    value={umbral}
                    onChange={(e) => setUmbral(Number(e.target.value))}
                    onPointerUp={aplicarAlSoltar}
                    onKeyUp={aplicarAlSoltar}
                    className="flex-1 accent-brand-700"
                  />
                  {/* Escribiéndolo se afina de uno en uno; con la barra es a
                      ojo. Se aplica al salir del campo o al pulsar Intro. */}
                  <input
                    type="number"
                    min={20}
                    max={230}
                    value={umbral}
                    onChange={(e) => setUmbral(Number(e.target.value))}
                    onBlur={aplicarAlSoltar}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        aplicarAlSoltar();
                      }
                    }}
                    className="input w-16 text-xs text-center py-1"
                    aria-label="Umbral exacto"
                  />
                </div>
                {/* Lo importante que hay que entender de este control. */}
                <span className="block text-[11px] text-ink-500 leading-tight mt-0.5">
                  Hacia la izquierda se graba <strong>solo lo más oscuro</strong>: los trazos
                  limpios, sin sombras ni grises. Hacia la derecha entran también los grises
                  y las sombras.
                </span>
              </div>

              <div className="space-y-2">
                <label className="block">
                  <span className="text-[11px] text-ink-600">Material</span>
                  <select name="material" className="input mt-0.5 text-xs" defaultValue={d.material}>
                    <option value="SILVER">Plateado</option>
                    <option value="GOLD">Dorado</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] text-ink-600">Unidades</span>
                  <input
                    name="unidades"
                    type="number"
                    min={1}
                    max={999}
                    defaultValue={d.unidades}
                    className="input mt-0.5 text-xs"
                  />
                </label>
              </div>
            </div>

            <label className="block">
              <span className="text-[11px] text-ink-600">Detalle</span>
              {/* Esto es lo que de verdad decide si el grabado sale limpio.
                  El vectorizado dibuja el CONTORNO de cada trazo, o sea dos
                  lineas por linea; con demasiado detalle se juntan y sale una
                  mancha, y ademas tarda muchisimo. */}
              <select name="detalle" className="input mt-0.5 text-xs" defaultValue={d.detalle}>
                <option value="grueso">Grueso — pocas líneas, limpio y rápido</option>
                <option value="medio">Medio</option>
                <option value="fino">Fino — mucho detalle, lento y puede emborronarse</option>
              </select>
              <span className="block text-[11px] text-ink-500 leading-tight mt-0.5">
                Si el grabado sale emborronado, baja el detalle. El umbral no
                arregla eso.
              </span>
            </label>

            <label className="flex items-center gap-2 text-[11px] text-ink-600">
              <input type="checkbox" name="invertido" defaultChecked={d.invertido} />
              Invertir (el dibujo es claro sobre fondo oscuro)
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <BotonChico
                icono={<Sliders className="h-3.5 w-3.5" />}
                texto="Aplicar y ver"
                cargando="Vectorizando…"
              />
              {ajuste.error && <span className="text-[11px] text-danger">{ajuste.error}</span>}
              {ajuste.mensaje && <span className="text-[11px] text-emerald-700">{ajuste.mensaje}</span>}
            </div>
          </form>

          {/* El puntero, aqui al lado del diseno. Estaba arriba del todo y
              obligaba a subir la pagina cada vez. */}
          <div className="rounded-lg bg-ink-50/60 border border-ink-100 p-2">
            <BotonReferencia referencia="llavero" etiqueta="Recuadro del llavero" />
          </div>

          {/* Al taller */}
          <div className="flex items-center gap-2 flex-wrap">
            <form action={accionEnviar} className="inline-flex flex-col gap-1">
              <input type="hidden" name="id" value={d.id} />
              <input type="hidden" name="confirmado" value={reintentar ? '1' : '0'} />
              <BotonEnviar lista={lista} yaGrabado={Boolean(d.grabado)} />
            </form>

            <a href={`/api/admin/llaveros/${d.id}/dxf`} className="btn-secondary text-xs" download>
              <Download className="h-3.5 w-3.5" /> Descargar DXF
            </a>

            {d.enCola && (
              <form action={accionCancelar}>
                <input type="hidden" name="id" value={d.id} />
                <BotonChico
                  icono={<X className="h-3.5 w-3.5" />}
                  texto="Sacar de la cola"
                  cargando="Sacando…"
                />
              </form>
            )}

            {d.enCola && (
              <span className="text-[11px] text-amber-700">
                Esperando en la grabadora
                {d.intentos > 0 && ` · intento ${d.intentos + 1}`}
              </span>
            )}
            {/* Si nadie pisa el pedal tres veces seguidas, el trabajo sale de
                la cola en vez de dar vueltas para siempre. Hay que decirlo. */}
            {!d.enCola && !d.grabado && d.intentos > 0 && (
              <span className="text-[11px] text-danger">
                Salió de la cola tras {d.intentos} intentos sin grabarse. Vuelve a enviarlo
                cuando estés en la máquina.
              </span>
            )}
            {!d.enCola && estado && !estado.conectado && (
              <span className="text-[11px] text-ink-500">Grabadora apagada · quedará en cola</span>
            )}
          </div>

          {envio.error && <div className="text-[11px] text-danger">{envio.error}</div>}
          {envio.mensaje && <div className="text-[11px] text-emerald-700">{envio.mensaje}</div>}
          {cancela.mensaje && <div className="text-[11px] text-ink-600">{cancela.mensaje}</div>}
        </div>
      </div>
    </div>
  );
}
