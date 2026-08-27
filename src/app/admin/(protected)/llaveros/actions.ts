'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apagarPuntero } from '@/lib/laser-puntero';
import {
  dxfDeLlavero,
  encajarEnVentana,
  esMaterial,
  getPerfilesLlavero,
  getVentanaLlavero,
  normalizarPerfiles,
  normalizarVentana,
  perfilParaMaterial,
  savePerfilesLlavero,
  saveVentanaLlavero,
  svgDeLlavero,
  UMBRAL_POR_DEFECTO,
  vectorizar,
  type Material,
  type VentanaLlavero,
} from '@/lib/llaveros';

/**
 * Grabado de llaveros. Prueba de taller: nada de aquí toca pedidos, clientes,
 * stock ni el control de negocio.
 */

const TIPOS = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

/** Margen entre el dibujo y el borde de la zona grabada. */
const MARGEN_MM = 1;

export interface LlaveroState {
  ok?: boolean;
  error?: string;
  mensaje?: string;
}

/**
 * Vectoriza la imagen del trabajo y guarda el DXF y la vista previa.
 *
 * Se hace aquí y no al vuelo en cada carga de la página porque vectorizar
 * tarda su rato y el resultado no cambia mientras no se toquen los ajustes.
 */
async function prepararTrabajo(id: string): Promise<{ contornos: number; puntos: number }> {
  const t = await prisma.keyringJob.findUnique({ where: { id } });
  if (!t) throw new Error('Ese diseño ya no existe.');

  const trazado = await vectorizar(Buffer.from(t.imagen), {
    umbral: t.umbral,
    invertir: t.invertido,
  });

  const ventana: VentanaLlavero = { anchoMm: t.anchoMm, altoMm: t.altoMm };
  const encaje = encajarEnVentana(trazado, ventana, MARGEN_MM);

  if (encaje.contornos.length === 0) {
    throw new Error(
      'Con ese umbral no queda nada que grabar. Muévelo hacia el otro lado, '
      + 'o prueba a invertir si el dibujo es claro sobre fondo oscuro.',
    );
  }

  const perfiles = await getPerfilesLlavero();
  const perfil = perfilParaMaterial(perfiles, t.material);
  const dxf = Buffer.from(dxfDeLlavero(encaje, ventana), 'utf-8');
  const svg = svgDeLlavero(encaje, ventana, t.material as Material, perfil.relleno);

  await prisma.keyringJob.update({
    where: { id },
    data: {
      dxf,
      size: dxf.length,
      contornos: encaje.contornos.length,
      vistaSvg: svg,
    },
  });

  return { contornos: encaje.contornos.length, puntos: encaje.puntos };
}

/** Sube un diseño nuevo y lo deja vectorizado y listo para mirar. */
export async function subirDiseno(
  _prev: LlaveroState,
  formData: FormData,
): Promise<LlaveroState> {
  const session = await requireAdmin({ write: true });

  const archivo = formData.get('imagen') as File | null;
  if (!archivo || archivo.size === 0) {
    return { error: 'Elige la imagen del diseño.' };
  }
  if (!TIPOS.includes(archivo.type)) {
    return { error: 'El archivo tiene que ser PNG, JPG o WEBP.' };
  }
  if (archivo.size > MAX_BYTES) {
    return { error: 'La imagen pesa más de 8 MB. Usa una más pequeña.' };
  }

  const material = String(formData.get('material') ?? '');
  if (!esMaterial(material)) return { error: 'Elige si el llavero es dorado o plateado.' };

  const unidades = Math.max(1, Math.min(999, Number(formData.get('unidades')) || 1));
  const nombre = String(formData.get('nombre') ?? '').trim().slice(0, 80)
    || archivo.name.replace(/\.[^.]+$/, '').slice(0, 80)
    || 'Llavero';

  const ventana = await getVentanaLlavero();
  const bytes = Buffer.from(await archivo.arrayBuffer());

  const creado = await prisma.keyringJob.create({
    data: {
      nombre,
      material,
      unidades,
      anchoMm: ventana.anchoMm,
      altoMm: ventana.altoMm,
      umbral: UMBRAL_POR_DEFECTO,
      invertido: false,
      imagen: bytes,
      imagenTipo: archivo.type,
      imagenNombre: archivo.name.slice(0, 120),
      createdBy: session.email,
    },
  });

  try {
    const r = await prepararTrabajo(creado.id);
    revalidatePath('/admin/llaveros');
    return {
      ok: true,
      mensaje: `Diseño preparado: ${r.contornos} contorno${r.contornos === 1 ? '' : 's'}. `
        + 'Mira la vista previa y ajusta el umbral si hace falta.',
    };
  } catch (e) {
    // El diseño se queda guardado aunque el trazado falle: así se puede
    // corregir el umbral sin volver a subir la imagen.
    revalidatePath('/admin/llaveros');
    return { error: e instanceof Error ? e.message : 'No he podido vectorizar la imagen.' };
  }
}

/** Cambia cómo se prepara el dibujo y lo vuelve a vectorizar. */
export async function ajustarDiseno(
  _prev: LlaveroState,
  formData: FormData,
): Promise<LlaveroState> {
  await requireAdmin({ write: true });

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Diseño no válido.' };

  const material = String(formData.get('material') ?? '');
  const datos: Record<string, unknown> = {
    umbral: Math.max(1, Math.min(254, Number(formData.get('umbral')) || UMBRAL_POR_DEFECTO)),
    invertido: String(formData.get('invertido') ?? '') === 'on',
    unidades: Math.max(1, Math.min(999, Number(formData.get('unidades')) || 1)),
  };
  if (esMaterial(material)) datos.material = material;

  // Si la zona de grabado ha cambiado desde que se subió, se reencaja a la de
  // ahora: al final es la medida del llavero que hay en la mesa.
  const ventana = await getVentanaLlavero();
  datos.anchoMm = ventana.anchoMm;
  datos.altoMm = ventana.altoMm;

  await prisma.keyringJob.update({ where: { id }, data: datos });

  try {
    const r = await prepararTrabajo(id);
    revalidatePath('/admin/llaveros');
    return { ok: true, mensaje: `Actualizado: ${r.contornos} contornos, ${r.puntos} puntos.` };
  } catch (e) {
    revalidatePath('/admin/llaveros');
    return { error: e instanceof Error ? e.message : 'No he podido vectorizar la imagen.' };
  }
}

/** Manda el llavero a la cola del taller. No dispara nada: espera al pedal. */
export async function enviarLlaveroAGrabadora(
  _prev: LlaveroState,
  formData: FormData,
): Promise<LlaveroState> {
  const session = await requireAdmin({ write: true });

  const id = String(formData.get('id') ?? '');
  const t = await prisma.keyringJob.findUnique({ where: { id } });
  if (!t) return { error: 'Ese diseño ya no existe.' };
  if (!t.dxf || t.size === 0) {
    return { error: 'Ese diseño todavía no tiene trazado. Ajusta el umbral y vuelve a prepararlo.' };
  }
  if (t.queuedAt && !t.engravedAt) {
    return { ok: true, mensaje: 'Ese llavero ya estaba esperando en la grabadora.' };
  }

  // Repetir es normal, pero tiene que ser queriendo: gasta un llavero.
  if (t.engravedAt && String(formData.get('confirmado') ?? '') !== '1') {
    const cuando = t.engravedAt.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
    });
    return {
      error: `Este llavero ya se grabó el ${cuando}. Pulsa otra vez para grabarlo de nuevo.`,
    };
  }

  await prisma.keyringJob.update({
    where: { id },
    data: { queuedAt: new Date(), queuedBy: session.email, takenAt: null, engravedAt: null },
  });

  // El puntero se apaga al mandar el trabajo: el puente no puede pasear la
  // referencia y preparar un grabado a la vez, y ya has colocado la pieza.
  await apagarPuntero();

  revalidatePath('/admin/llaveros');
  const uds = t.unidades === 1 ? '1 llavero' : `${t.unidades} llaveros`;
  return { ok: true, mensaje: `Enviado a la grabadora (${uds}). Ve a la máquina y pisa el pedal.` };
}

/** Saca de la cola un llavero que aún no se ha grabado. */
export async function cancelarLlavero(
  _prev: LlaveroState,
  formData: FormData,
): Promise<LlaveroState> {
  await requireAdmin({ write: true });
  const id = String(formData.get('id') ?? '');
  const t = await prisma.keyringJob.findUnique({ where: { id } });
  if (!t) return { error: 'Ese diseño ya no existe.' };
  if (t.engravedAt) return { error: 'Ese llavero ya está grabado.' };

  await prisma.keyringJob.update({
    where: { id },
    data: { queuedAt: null, queuedBy: null, takenAt: null },
  });
  revalidatePath('/admin/llaveros');
  return { ok: true, mensaje: 'Sacado de la cola.' };
}

export async function borrarDiseno(formData: FormData): Promise<void> {
  await requireAdmin({ write: true });
  const id = String(formData.get('id') ?? '');
  if (id) await prisma.keyringJob.delete({ where: { id } }).catch(() => null);
  revalidatePath('/admin/llaveros');
}

/** Guarda la zona a grabar y los parámetros de máquina de cada material. */
export async function guardarAjustesLlavero(
  _prev: LlaveroState,
  formData: FormData,
): Promise<LlaveroState> {
  await requireAdmin({ write: true, permission: 'CONFIG_WRITE' });

  await saveVentanaLlavero(normalizarVentana({
    anchoMm: formData.get('anchoMm'),
    altoMm: formData.get('altoMm'),
  }));

  const actuales = await getPerfilesLlavero();
  const perfiles = actuales.perfiles.map((p, i) => ({
    ...p,
    potenciaPct: Number(formData.get(`p${i}_potencia`)),
    velocidadMmS: Number(formData.get(`p${i}_velocidad`)),
    pasadas: Number(formData.get(`p${i}_pasadas`)),
    frecuenciaKHz: Number(formData.get(`p${i}_frecuencia`)),
    relleno: formData.get(`p${i}_relleno`) === 'on',
    pasoRellenoMm: Number(formData.get(`p${i}_paso`)),
    notas: String(formData.get(`p${i}_notas`) ?? ''),
  }));

  await savePerfilesLlavero(normalizarPerfiles({ perfiles, porMaterial: actuales.porMaterial }));

  revalidatePath('/admin/llaveros');
  return { ok: true, mensaje: 'Ajustes guardados. Los diseños que prepares a partir de ahora los usarán.' };
}
