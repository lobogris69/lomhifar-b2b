'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { SETTING_KEYS, setSetting, type PrintArea } from '@/lib/settings';

export interface SaveAreaState {
  ok?: boolean;
  error?: string;
}

export async function saveBraceletAreas(
  _prev: SaveAreaState,
  formData: FormData,
): Promise<SaveAreaState> {
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  await requireAdmin({ write: true });

  try {
    const black = readArea(formData, 'black');
    const red = readArea(formData, 'red');

    await Promise.all([
      setSetting(SETTING_KEYS.CONFIGURATOR_AREA_BLACK, JSON.stringify(black)),
      setSetting(SETTING_KEYS.CONFIGURATOR_AREA_RED, JSON.stringify(red)),
    ]);

    revalidatePath('/admin/imagenes/pulseras');
    revalidatePath('/tienda');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar' };
  }
}

function readArea(form: FormData, prefix: string): PrintArea {
  const num = (k: string, def: number, min: number, max: number) => {
    const raw = form.get(`${prefix}_${k}`);
    const n = Number(raw);
    if (!Number.isFinite(n)) return def;
    return Math.min(max, Math.max(min, n));
  };
  const colorRaw = String(form.get(`${prefix}_textColor`) ?? '').trim();
  const textColor = /^#[0-9a-fA-F]{6}$/.test(colorRaw) ? colorRaw : '#1f1f24';
  return {
    leftPct: num('leftPct', 38, 0, 100),
    topPct: num('topPct', 44, 0, 100),
    widthPct: num('widthPct', 24, 1, 100),
    heightPct: num('heightPct', 10, 1, 100),
    rotationDeg: num('rotationDeg', 0, -180, 180),
    textColor,
  };
}
