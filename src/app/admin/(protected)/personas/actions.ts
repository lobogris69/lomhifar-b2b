'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { SETTING_KEYS, setSetting, type MarketingPersona } from '@/lib/settings';

export interface SavePersonasState {
  ok?: boolean;
  error?: string;
}

export async function savePersonas(
  _prev: SavePersonasState,
  formData: FormData,
): Promise<SavePersonasState> {
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  await requireAdmin({ write: true, permission: 'ASSETS_WRITE' });

  try {
    const personas: MarketingPersona[] = [];
    for (let i = 0; i < 8; i++) {
      const colorRaw = String(formData.get(`p${i}_color`) ?? 'BLACK');
      const color: 'BLACK' | 'RED' = colorRaw === 'RED' ? 'RED' : 'BLACK';
      personas.push({
        emoji: String(formData.get(`p${i}_emoji`) ?? '').trim().slice(0, 8) || '🧑',
        group: String(formData.get(`p${i}_group`) ?? '').trim().slice(0, 60) || `Persona ${i + 1}`,
        ageRange: String(formData.get(`p${i}_ageRange`) ?? '').trim().slice(0, 40),
        context: String(formData.get(`p${i}_context`) ?? '').trim().slice(0, 200),
        color,
        line1: String(formData.get(`p${i}_line1`) ?? '').trim().slice(0, 30),
        line2: String(formData.get(`p${i}_line2`) ?? '').trim().slice(0, 30),
        why: String(formData.get(`p${i}_why`) ?? '').trim().slice(0, 500),
      });
    }

    await setSetting(SETTING_KEYS.MARKETING_PERSONAS_JSON, JSON.stringify(personas));

    revalidatePath('/admin/personas');
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar' };
  }
}

/** Restaura los 8 valores por defecto (borra el setting custom). */
export async function resetPersonasAction() {
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  await requireAdmin({ write: true, permission: 'ASSETS_WRITE' });
  await setSetting(SETTING_KEYS.MARKETING_PERSONAS_JSON, '');
  revalidatePath('/admin/personas');
  revalidatePath('/', 'layout');
}
