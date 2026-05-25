'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { resetSiteText, setSiteText, TEXT_SLOTS } from '@/lib/site-texts';

async function ensureAdmin() {
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  await requireAdmin({ write: true });
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
  // Revalidamos TODO el layout público — los textos se usan en muchas
  // páginas (landing, /acceso, /tienda, /carrito, /pedidos, etc.) y no
  // queremos cachear valores antiguos.
  revalidatePath('/', 'layout');
  revalidatePath('/admin/textos');
  return { ok: true, key };
}

export async function resetTextToDefault(formData: FormData) {
  await ensureAdmin();
  const key = String(formData.get('key') ?? '');
  await resetSiteText(key);
  revalidatePath('/', 'layout');
  revalidatePath('/admin/textos');
}
