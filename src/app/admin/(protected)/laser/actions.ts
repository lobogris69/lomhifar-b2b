'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { SETTING_KEYS, setSetting, type SettingKey } from '@/lib/settings';
import { generarClaveDelPuente } from '@/lib/laser-cola';
import {
  saveLaserProfiles,
  normalizar,
  LIMITES,
  type LaserProfile,
} from '@/lib/laser-profiles';

export interface SaveLaserState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Guarda la configuración del área imprimible de la placa láser.
 * Cualquier cambio se refleja de inmediato en el preview y en los
 * DXF que se generen a partir de ahora.
 */
export async function saveLaserSettings(
  _prev: SaveLaserState,
  formData: FormData,
): Promise<SaveLaserState> {
  await requireAdmin({ write: true });

  const parse = (name: string, min: number, max: number): { ok: true; v: number } | { ok: false; err: string } => {
    const raw = String(formData.get(name) ?? '').replace(',', '.').trim();
    const n = Number(raw);
    if (!Number.isFinite(n)) return { ok: false, err: 'Número no válido' };
    if (n < min) return { ok: false, err: `Mínimo ${min}` };
    if (n > max) return { ok: false, err: `Máximo ${max}` };
    return { ok: true, v: n };
  };

  const fe: Record<string, string> = {};
  const values: Record<string, number> = {};
  const fields: Array<[string, number, number, SettingKey]> = [
    ['plateWidthMm', 5, 500, SETTING_KEYS.LASER_PLATE_WIDTH_MM],
    ['plateHeightMm', 3, 500, SETTING_KEYS.LASER_PLATE_HEIGHT_MM],
    ['marginLeftMm', 0, 100, SETTING_KEYS.LASER_MARGIN_LEFT_MM],
    ['marginRightMm', 0, 100, SETTING_KEYS.LASER_MARGIN_RIGHT_MM],
    ['marginTopMm', 0, 100, SETTING_KEYS.LASER_MARGIN_TOP_MM],
    ['marginBottomMm', 0, 100, SETTING_KEYS.LASER_MARGIN_BOTTOM_MM],
    ['lineHeightFactor', 0.5, 3, SETTING_KEYS.LASER_LINE_HEIGHT_FACTOR],
    ['curveSteps', 6, 64, SETTING_KEYS.LASER_CURVE_STEPS],
  ];
  for (const [name, min, max] of fields) {
    const res = parse(name, min, max);
    if (!res.ok) fe[name] = res.err;
    else values[name] = res.v;
  }

  if (Object.keys(fe).length > 0) {
    return { fieldErrors: fe };
  }

  // Validaciones cruzadas
  const usableW = values.plateWidthMm - values.marginLeftMm - values.marginRightMm;
  const usableH = values.plateHeightMm - values.marginTopMm - values.marginBottomMm;
  if (usableW <= 0.5) {
    return { error: 'Los márgenes izq+der son mayores que el ancho útil de la placa.' };
  }
  if (usableH <= 0.5) {
    return { error: 'Los márgenes sup+inf son mayores que el alto útil de la placa.' };
  }

  await Promise.all(
    fields.map(([name, , , key]) => setSetting(key, String(values[name]))),
  );

  revalidatePath('/admin/laser');
  revalidatePath('/admin/pedidos', 'layout');
  return { ok: true };
}

// ============================================================
// Perfiles de grabado por material
// ============================================================


export interface SaveProfilesState {
  ok?: boolean;
  error?: string;
}

/**
 * Guarda la lista completa de perfiles y el mapeo color → perfil.
 *
 * El formulario manda los campos indexados (p0_nombre, p0_potencia, …) más
 * `count` con cuántos perfiles hay, y color_BLACK / color_RED con el perfil
 * asignado a cada color de pulsera.
 */
export async function saveLaserProfilesAction(
  _prev: SaveProfilesState,
  formData: FormData,
): Promise<SaveProfilesState> {
  await requireAdmin({ write: true });

  const count = Number(formData.get('count') ?? 0);
  if (!Number.isFinite(count) || count < 1) {
    return { error: 'Tiene que haber al menos un perfil.' };
  }

  const n = (name: string, def: number, lim: { min: number; max: number }) => {
    const v = Number(String(formData.get(name) ?? '').replace(',', '.'));
    if (!Number.isFinite(v)) return def;
    return Math.min(lim.max, Math.max(lim.min, v));
  };

  const perfiles: LaserProfile[] = [];
  const vistos = new Set<string>();

  for (let i = 0; i < count; i++) {
    const nombre = String(formData.get(`p${i}_nombre`) ?? '').trim();
    if (!nombre) return { error: `El perfil ${i + 1} no tiene nombre.` };

    // El id se deriva del nombre para que sea legible en la BD, pero se
    // conserva el original si ya existía: así el mapeo por color no se
    // rompe al renombrar un perfil.
    const idPrevio = String(formData.get(`p${i}_id`) ?? '').trim();
    let id =
      idPrevio ||
      nombre
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) ||
      `perfil-${i + 1}`;
    while (vistos.has(id)) id = `${id}-2`;
    vistos.add(id);

    perfiles.push({
      id,
      nombre: nombre.slice(0, 60),
      potenciaPct: n(`p${i}_potencia`, 70, LIMITES.potenciaPct),
      velocidadMmS: n(`p${i}_velocidad`, 250, LIMITES.velocidadMmS),
      pasadas: Math.round(n(`p${i}_pasadas`, 1, LIMITES.pasadas)),
      frecuenciaKHz: n(`p${i}_frecuencia`, 30, LIMITES.frecuenciaKHz),
      relleno: formData.get(`p${i}_relleno`) === 'on',
      pasoRellenoMm: n(`p${i}_paso`, 0.05, LIMITES.pasoRellenoMm),
      notas: String(formData.get(`p${i}_notas`) ?? '').slice(0, 500),
    });
  }

  const porColor: Record<string, string> = {};
  for (const color of ['BLACK', 'RED']) {
    const id = String(formData.get(`color_${color}`) ?? '');
    if (id) porColor[color] = id;
  }

  await saveLaserProfiles(normalizar({ perfiles, porColor }));

  revalidatePath('/admin/laser');
  revalidatePath('/admin/pedidos', 'layout');
  return { ok: true };
}


// ============================================================
// Clave del puente de la grabadora
// ============================================================


export interface ClaveState {
  ok?: boolean;
  clave?: string;
  error?: string;
}

/**
 * Genera una clave nueva para el puente del taller.
 *
 * Al regenerarla, el puente que estuviera usando la anterior deja de tener
 * acceso hasta que se le copie la nueva. Se avisa de eso en la pantalla.
 */
export async function regenerarClaveDelPuente(): Promise<ClaveState> {
  await requireAdmin({ write: true });
  try {
    const clave = await generarClaveDelPuente();
    revalidatePath('/admin/laser');
    return { ok: true, clave };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo generar la clave.' };
  }
}
