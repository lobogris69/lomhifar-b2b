'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { addToCart, CARRITO_LLENO } from '@/lib/cart';
import { getCustomerSession } from '@/lib/auth';
import { getSettings, SETTING_KEYS } from '@/lib/settings';

/**
 * El esquema se arma con lo que hay configurado en el panel, no con números
 * escritos aquí.
 *
 * Estaban fijos a 40 caracteres y a 1 unidad mínima, mientras el panel deja
 * poner hasta 60 caracteres y una cantidad mínima por línea. Con el máximo
 * por encima de 40 el configurador dejaba escribir y luego el carrito lo
 * rechazaba con un error de la librería, en inglés; y la cantidad mínima
 * podía configurarse, guardarse y no aplicarse en ninguna parte.
 */
function esquemaDeAlta(maxChars: number, minUds: number) {
  const largo = `Máximo ${maxChars} caracteres por línea`;
  return z.object({
    color: z.enum(['BLACK', 'RED']),
    quantity: z.coerce.number().int()
      .min(minUds, minUds > 1 ? `Mínimo ${minUds} unidades por línea` : undefined)
      .max(9999),
    line1: z.string().min(1, 'La línea 1 es obligatoria').max(maxChars, largo),
    line2: z.string().max(maxChars, largo),
    line3: z.string().max(maxChars, largo),
    confirmed: z.literal('on', {
      errorMap: () => ({ message: 'Debe confirmar que los datos son correctos' }),
    }),
  });
}

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

  const ajustes = await getSettings();
  const maxChars = Math.max(5, Math.min(60,
    Number(ajustes[SETTING_KEYS.MAX_CHARS_PER_LINE]) || 19));
  const minUds = Math.max(1, Number(ajustes[SETTING_KEYS.MIN_QUANTITY_PER_LINE]) || 1);

  const parsed = esquemaDeAlta(maxChars, minUds).safeParse(raw);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe };
  }

  const cabe = addToCart({
    color: parsed.data.color,
    quantity: parsed.data.quantity,
    line1: parsed.data.line1,
    line2: parsed.data.line2,
    line3: parsed.data.line3,
  });
  if (!cabe) return { error: CARRITO_LLENO };

  revalidatePath('/tienda');
  revalidatePath('/tienda/carrito');
  redirect('/tienda/carrito?added=1');
}
