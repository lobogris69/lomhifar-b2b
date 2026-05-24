'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCustomerSession } from '@/lib/auth';
import { addToCart } from '@/lib/cart';

/**
 * Reordena: añade al carrito todas las pulseras de un pedido anterior
 * (manteniendo color, unidades y grabado). Útil para recomprar lo mismo.
 */
export async function reorderAction(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect('/acceso');

  const orderId = String(formData.get('orderId') ?? '');
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: session.customer.id },
    include: { items: true },
  });
  if (!order) redirect('/tienda/pedidos');

  for (const it of order.items) {
    addToCart({
      color: it.color,
      quantity: it.quantity,
      line1: it.line1,
      line2: it.line2,
    });
  }

  revalidatePath('/tienda/carrito');
  redirect('/tienda/carrito?reordered=1');
}
