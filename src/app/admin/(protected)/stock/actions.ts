'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { ensureStockBase } from '@/lib/stock';

async function ensureAdmin() {
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  return await requireAdmin({ write: true, permission: 'CONFIG_WRITE' });
}

const adjustSchema = z.object({
  color: z.enum(['BLACK', 'RED']),
  delta: z.coerce.number().int(),  // puede ser positivo (entrada) o negativo (ajuste)
  reason: z.enum(['COMPRA', 'AJUSTE', 'DEVOLUCION', 'MERMA']),
  note: z.string().max(500).optional().or(z.literal('')),
});

export interface AdjustStockState {
  error?: string;
  ok?: boolean;
  color?: string;
}

export async function adjustStock(
  _prev: AdjustStockState,
  formData: FormData,
): Promise<AdjustStockState> {
  const session = await ensureAdmin();
  await ensureStockBase();

  const parsed = adjustSchema.safeParse({
    color: String(formData.get('color') ?? ''),
    delta: String(formData.get('delta') ?? '0'),
    reason: String(formData.get('reason') ?? ''),
    note: String(formData.get('note') ?? ''),
  });
  if (!parsed.success) return { error: 'Datos no válidos' };
  if (parsed.data.delta === 0) return { error: 'La cantidad no puede ser 0' };

  const stock = await prisma.stock.findUnique({ where: { color: parsed.data.color } });
  if (!stock) return { error: 'Color no encontrado' };

  await prisma.$transaction([
    prisma.stock.update({
      where: { id: stock.id },
      data: { quantity: stock.quantity + parsed.data.delta },
    }),
    prisma.stockMovement.create({
      data: {
        stockId: stock.id,
        delta: parsed.data.delta,
        reason: parsed.data.reason,
        note: parsed.data.note || null,
        createdBy: session.email,
      },
    }),
  ]);

  revalidatePath('/admin/stock');
  revalidatePath('/admin');
  return { ok: true, color: parsed.data.color };
}

const updateMinSchema = z.object({
  color: z.enum(['BLACK', 'RED']),
  minAlertLevel: z.coerce.number().int().min(0).max(10000),
});

export async function updateMinAlert(formData: FormData) {
  await ensureAdmin();
  const parsed = updateMinSchema.safeParse({
    color: String(formData.get('color') ?? ''),
    minAlertLevel: String(formData.get('minAlertLevel') ?? '0'),
  });
  if (!parsed.success) return;
  await prisma.stock.update({
    where: { color: parsed.data.color },
    data: { minAlertLevel: parsed.data.minAlertLevel },
  });
  revalidatePath('/admin/stock');
}
