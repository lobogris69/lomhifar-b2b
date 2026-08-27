'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { esReferencia, setPuntero, type Referencia } from '@/lib/laser-puntero';

export interface PunteroState {
  ok?: boolean;
  error?: string;
  modo?: Referencia;
}

/**
 * Pide al taller que el puntero rojo enseñe una referencia.
 *
 * No pasa nada al instante: la web lo deja escrito y el puente lo recoge en su
 * siguiente consulta, unos segundos después.
 */
export async function mostrarReferencia(
  _prev: PunteroState,
  formData: FormData,
): Promise<PunteroState> {
  await requireAdmin({ write: true });

  const modo = String(formData.get('modo') ?? '');
  if (!esReferencia(modo)) return { error: 'Referencia no válida.' };

  await setPuntero(modo);
  revalidatePath('/admin/llaveros');
  return { ok: true, modo };
}
