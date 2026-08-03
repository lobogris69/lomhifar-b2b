'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { SETTING_KEYS, setSetting, type SettingKey } from '@/lib/settings';

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
