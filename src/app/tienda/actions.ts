'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { addToCart } from '@/lib/cart';
import { getCustomerSession } from '@/lib/auth';

const addSchema = z.object({
  color: z.enum(['BLACK', 'RED']),
  quantity: z.coerce.number().int().min(1).max(9999),
  line1: z.string().min(1, 'La línea 1 es obligatoria').max(40),
  line2: z.string().max(40),
  line3: z.string().max(40),
  confirmed: z.literal('on', {
    errorMap: () => ({ message: 'Debe confirmar que los datos son correctos' }),
  }),
});

export interface AddState {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
}

export async function addBraceletToCart(
  _prev: AddState,
  formData: FormData,
): Promise<AddState> {
  const session = await getCustomerSession();
  if (!session) redirect('/acceso');

  const raw = {
    color: String(formData.get('color') ?? ''),
    quantity: String(formData.get('quantity') ?? '1'),
    line1: String(formData.get('line1') ?? '').trim(),
    line2: String(formData.get('line2') ?? '').trim(),
    line3: String(formData.get('line3') ?? '').trim(),
    confirmed: String(formData.get('confirmed') ?? ''),
  };

  const parsed = addSchema.safeParse(raw);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe };
  }

  addToCart({
    color: parsed.data.color,
    quantity: parsed.data.quantity,
    line1: parsed.data.line1,
    line2: parsed.data.line2,
    line3: parsed.data.line3,
  });

  revalidatePath('/tienda');
  revalidatePath('/tienda/carrito');
  redirect('/tienda/carrito?added=1');
}
