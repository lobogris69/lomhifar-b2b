'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { SETTING_KEYS, setSetting, type SettingKey } from '@/lib/settings';

export interface SaveBizState {
  ok?: boolean;
  error?: string;
}

function eurosToCents(v: FormDataEntryValue | null): number {
  if (v == null) return 0;
  const s = String(v).replace(',', '.').trim();
  const n = Math.round(Number(s) * 100);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function intOr(v: FormDataEntryValue | null, def: number): number {
  const n = Math.floor(Number(String(v ?? '').trim()));
  return Number.isFinite(n) && n > 0 ? n : def;
}

/**
 * Guarda los parámetros de coste del negocio. Solo SUPER_ADMIN/ADMIN
 * (datos financieros sensibles) — requireAdmin({write}) ya bloquea VIEWER,
 * y la ruta está restringida por rol en admin-roles.
 */
export async function saveBizParams(
  _prev: SaveBizState,
  formData: FormData,
): Promise<SaveBizState> {
  await requireAdmin({ write: true });

  const pairs: Array<[SettingKey, string]> = [
    [SETTING_KEYS.BIZ_COST_BRACELET_BLACK_CENTS, String(eurosToCents(formData.get('costBlack')))],
    [SETTING_KEYS.BIZ_COST_BRACELET_RED_CENTS, String(eurosToCents(formData.get('costRed')))],
    [SETTING_KEYS.BIZ_COST_ENGRAVING_CENTS, String(eurosToCents(formData.get('costEngraving')))],
    [SETTING_KEYS.BIZ_COST_SHIPPING_REAL_CENTS, String(eurosToCents(formData.get('costShipping')))],
    [SETTING_KEYS.BIZ_COMMISSION_PER_UNIT_CENTS, String(eurosToCents(formData.get('commission')))],
    [SETTING_KEYS.BIZ_MACHINE_PRICE_CENTS, String(eurosToCents(formData.get('machinePrice')))],
    [SETTING_KEYS.BIZ_MACHINE_LIFE_UNITS, String(intOr(formData.get('machineLife'), 20000))],
  ];

  await Promise.all(pairs.map(([k, v]) => setSetting(k, v)));

  revalidatePath('/admin/negocio');
  return { ok: true };
}
