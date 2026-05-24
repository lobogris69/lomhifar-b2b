'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { resetSiteText, setSiteText, TEXT_SLOTS } from '@/lib/site-texts';

async function ensureAdmin() {
  const s = await getAdminSession();
  if (!s) redirect('/admin/login');
}

export interface UpdateTextState {
  ok?: boolean;
  error?: string;
  key?: string;
}

export async function updateSiteText(
  _prev: UpdateTextState,
  formData: FormData,
): Promise<UpdateTextState> {
  await ensureAdmin();
  const key = String(formData.get('key') ?? '');
  const value = String(formData.get('value') ?? '');

  const slot = TEXT_SLOTS.find((s) => s.key === key);
  if (!slot) return { error: 'Texto no encontrado', key };
  if (slot.maxLength && value.length > slot.maxLength) {
    return { error: `Máximo ${slot.maxLength} caracteres`, key };
  }
  if (slot.type === 'select' && slot.options) {
    const valid = slot.options.some((o) => o.value === value);
    if (!valid) return { error: 'Valor no válido', key };
  }

  await setSiteText(key, value);
  // Revalidar las páginas que pueden usar este texto
  revalidatePath('/acceso');
  revalidatePath('/admin/textos');
  return { ok: true, key };
}

export async function resetTextToDefault(formData: FormData) {
  await ensureAdmin();
  const key = String(formData.get('key') ?? '');
  await resetSiteText(key);
  revalidatePath('/acceso');
  revalidatePath('/admin/textos');
}
