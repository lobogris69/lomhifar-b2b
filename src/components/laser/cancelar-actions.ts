'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface CancelarState {
  ok?: boolean;
  error?: string;
  mensaje?: string;
}

/**
 * Saca de la cola TODO lo que esté esperando.
 *
 * No es un paro de emergencia y no lo aparenta: viaja por internet y el
 * puente pregunta cada pocos segundos, así que tarda. Para parar la máquina
 * de verdad está su interruptor.
 *
 * Sirve para lo corriente: te has equivocado de diseño, o la pieza no está
 * bien puesta, y no quieres que se grabe cuando alguien roce el pedal.
 */
export async function cancelarLoEncolado(
  _prev: CancelarState,
  _formData: FormData,
): Promise<CancelarState> {
  await requireAdmin({ write: true });

  const [pulseras, llaveros] = await Promise.all([
    prisma.laserFile.updateMany({
      where: { queuedAt: { not: null }, engravedAt: null },
      data: { queuedAt: null, queuedBy: null, takenAt: null },
    }),
    prisma.keyringJob.updateMany({
      where: { queuedAt: { not: null }, engravedAt: null },
      data: { queuedAt: null, queuedBy: null, takenAt: null },
    }),
  ]);

  revalidatePath('/admin/llaveros');
  const total = pulseras.count + llaveros.count;
  return {
    ok: true,
    mensaje: total === 0
      ? 'No había nada esperando.'
      : `Sacado de la cola: ${total} trabajo${total === 1 ? '' : 's'}. `
        + 'Si la máquina ya estaba armada, no grabará al pisar.',
  };
}
