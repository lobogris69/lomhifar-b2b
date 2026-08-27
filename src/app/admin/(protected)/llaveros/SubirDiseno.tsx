'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { subirDiseno, type LlaveroState } from './actions';

const inicial: LlaveroState = {};

/**
 * Lado máximo al que se reduce la imagen antes de mandarla.
 *
 * Una imagen generada por IA viene a 3.000 o 4.000 píxeles y pesa quince o
 * veinte megas. Al enviarla, el servidor la rechazaba por tamaño y la página
 * se caía con un error genérico, sin decir por qué.
 *
 * Y no hace falta ni de lejos: el dibujo se graba en 30 mm. A 1.600 píxeles
 * de lado hay muchísimo más detalle del que el láser puede marcar, y además
 * el vectorizado va bastante más rápido.
 */
const LADO_MAX = 1600;

/** A partir de aquí se reduce. Por debajo se manda tal cual. */
const REDUCIR_DESDE_BYTES = 1.5 * 1024 * 1024;

/** Tope de seguridad: por encima de esto no se intenta enviar. */
const TOPE_BYTES = 8 * 1024 * 1024;

function Boton({ bloqueado }: { bloqueado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || bloqueado} className="btn-primary text-sm">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {pending ? 'Preparando el trazado…' : 'Subir y preparar'}
    </button>
  );
}

/** Reduce la imagen en el navegador. Devuelve el original si no hace falta. */
async function reducir(original: File): Promise<{ archivo: File; reducida: boolean }> {
  if (original.size < REDUCIR_DESDE_BYTES) return { archivo: original, reducida: false };

  const bitmap = await createImageBitmap(original).catch(() => null);
  if (!bitmap) return { archivo: original, reducida: false };

  const mayor = Math.max(bitmap.width, bitmap.height);
  if (mayor <= LADO_MAX) {
    bitmap.close();
    return { archivo: original, reducida: false };
  }

  const escala = LADO_MAX / mayor;
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);

  const ctx = lienzo.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return { archivo: original, reducida: false };
  }
  // Fondo blanco: si el PNG es transparente, lo transparente tiene que
  // contar como «no grabar», no como negro.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  ctx.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, 'image/png'));
  if (!blob) return { archivo: original, reducida: false };

  const nombre = original.name.replace(/\.[^.]+$/, '') + '.png';
  return { archivo: new File([blob], nombre, { type: 'image/png' }), reducida: true };
}

/**
 * Alta de un diseño. La imagen se vectoriza al subirla, así que el botón
 * tarda unos segundos: por eso avisa de lo que está haciendo.
 *
 * En cuanto se elige el archivo se enseña la imagen, antes de subir nada, y
 * si viene enorme se reduce aquí mismo.
 */
export function SubirDiseno({ anchoMm, altoMm }: { anchoMm: number; altoMm: number }) {
  const [state, action] = useFormState(subirDiseno, inicial);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<string>('');
  const [aviso, setAviso] = useState<string>('');
  const [problema, setProblema] = useState<string>('');
  const [preparando, setPreparando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  // La miniatura se hace en el navegador. La URL temporal hay que soltarla al
  // cambiar de archivo, o el navegador se va quedando la imagen en memoria.
  useEffect(() => {
    if (!archivo) {
      setVista('');
      return;
    }
    const url = URL.createObjectURL(archivo);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const elegido = e.target.files?.[0] ?? null;
    setAviso('');
    setProblema('');
    if (!elegido) {
      setArchivo(null);
      return;
    }

    setPreparando(true);
    try {
      const { archivo: listo, reducida } = await reducir(elegido);

      if (listo.size > TOPE_BYTES) {
        setArchivo(elegido);
        setProblema(
          `La imagen pesa ${Math.round(listo.size / 1024 / 1024)} MB y no se puede enviar. `
          + 'Guárdala más pequeña y vuelve a intentarlo.',
        );
        return;
      }

      if (reducida && entrada.current) {
        // Se cambia el archivo del formulario por el reducido: es lo que se
        // va a enviar.
        const dt = new DataTransfer();
        dt.items.add(listo);
        entrada.current.files = dt.files;
        setAviso(
          `Reducida de ${Math.round(elegido.size / 1024 / 1024 * 10) / 10} MB `
          + `a ${Math.round(listo.size / 1024)} KB para poder enviarla. `
          + 'Para grabar en 30 mm sobra detalle.',
        );
      }
      setArchivo(listo);
    } finally {
      setPreparando(false);
    }
  }

  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {state.mensaje && <Alert variant="success">{state.mensaje}</Alert>}
      {problema && <Alert variant="danger">{problema}</Alert>}
      {aviso && <Alert variant="info">{aviso}</Alert>}

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
            ref={entrada}
            name="imagen"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={alElegir}
            className="mt-1 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-800 file:font-medium"
          />
          <span className="text-[11px] text-ink-500">
            {preparando
              ? 'Preparando la imagen…'
              : 'PNG, JPG o WEBP. Dibujo de trazos, no una fotografía. '
                + 'El fondo transparente o blanco no se graba.'}
          </span>
        </label>
      </div>

      {/* La imagen tal cual, antes de tocarla. Lo que va a grabar el láser se
          ve después, en la ficha del diseño, ya vectorizado. */}
      {vista && archivo && (
        <div className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50/60 p-3">
          <img
            src={vista}
            alt={archivo.name}
            className="h-24 w-24 shrink-0 rounded border border-ink-200 bg-white object-contain"
          />
          <div className="min-w-0 text-xs text-ink-600 space-y-0.5">
            <div className="font-medium text-ink-900 truncate">{archivo.name}</div>
            <div>{Math.round(archivo.size / 1024)} KB</div>
            <div className="text-ink-500">
              Así es la imagen. El trazado que va a recorrer el láser lo verás abajo,
              en cuanto la subas.
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Boton bloqueado={preparando || Boolean(problema)} />
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-500">
          <ImageIcon className="h-3.5 w-3.5" />
          Se encajará entera dentro de {anchoMm} × {altoMm} mm, sin deformarla.
        </span>
      </div>
    </form>
  );
}
