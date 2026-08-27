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

  // Si el pedido que se repite no cabe entero, se para donde deje de caber
  // y se dice cuántas líneas han entrado. Antes las de más se perdían sin
  // que nadie se enterara.
  let metidas = 0;
  for (const it of order.items) {
    const cabe = addToCart({
      color: it.color,
      quantity: it.quantity,
      line1: it.line1,
      line2: it.line2,
      line3: it.line3 ?? '',
    });
    if (!cabe) break;
    metidas += 1;
  }

  revalidatePath('/tienda/carrito');
  if (metidas < order.items.length) {
    redirect(`/tienda/carrito?reordered=1&parcial=${metidas}&de=${order.items.length}`);
  }
  redirect('/tienda/carrito?reordered=1');
}
