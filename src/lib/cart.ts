import { cookies } from 'next/headers';
import { z } from 'zod';

const CART_COOKIE = 'lomhifar_cart';
const MAX_ITEMS = 50;

/**
 * Tope real del carrito, en bytes de la cookie.
 *
 * El carrito entero viaja dentro de una cookie, y los navegadores tiran las
 * que pasan de 4 KB sin decir nada: ni error, ni aviso. Con tres líneas de
 * texto por pulsera eso llegaba alrededor de la línea 19, y a partir de ahí
 * la farmacia añadía pulseras y el carrito se quedaba como estaba. Perder un
 * pedido en silencio es lo peor que puede pasar aquí, así que ahora se mide
 * antes de escribir y, si no cabe, se dice.
 *
 * 3.800 deja margen para el nombre de la cookie y sus atributos.
 */
const MAX_BYTES = 3800;

export const CARRITO_LLENO =
  'El carrito no admite más líneas distintas. Finaliza este pedido y haz otro a continuación: ' +
  'se te respetan los precios y los descuentos igual.';

export const cartItemSchema = z.object({
  id: z.string(),
  color: z.string(),  // BLACK | RED — laxo para acomodar datos de Prisma
  quantity: z.number().int().min(1).max(9999),
  line1: z.string().max(40),
  line2: z.string().max(40),
  line3: z.string().max(40).default(''),
});

export type CartItem = z.infer<typeof cartItemSchema>;

const cartSchema = z.array(cartItemSchema);

export function readCart(): CartItem[] {
  const cookie = cookies().get(CART_COOKIE);
  if (!cookie?.value) return [];
  try {
    const parsed = JSON.parse(cookie.value);
    const result = cartSchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

/** ¿Cabe este carrito en la cookie del navegador? */
export function cabeElCarrito(items: CartItem[]): boolean {
  if (items.length > MAX_ITEMS) return false;
  return Buffer.byteLength(JSON.stringify(items), 'utf8') <= MAX_BYTES;
}

export function writeCart(items: CartItem[]): void {
  const trimmed = items.slice(0, MAX_ITEMS);
  cookies().set(CART_COOKIE, JSON.stringify(trimmed), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 días
  });
}

export function clearCart(): void {
  cookies().delete(CART_COOKIE);
}

export function newCartItemId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Añade una línea al carrito. Devuelve `false` si ya no cabe, para que quien
 * llama avise en pantalla en vez de dar el añadido por bueno.
 */
export function addToCart(item: Omit<CartItem, 'id'>): boolean {
  const cart = readCart();
  cart.push({ ...item, id: newCartItemId() });
  if (!cabeElCarrito(cart)) return false;
  writeCart(cart);
  return true;
}

export function removeCartItem(id: string): CartItem[] {
  const cart = readCart().filter((i) => i.id !== id);
  writeCart(cart);
  return cart;
}

export function colorLabel(color: string): string {
  return color === 'BLACK' ? 'Negra' : color === 'RED' ? 'Roja' : color;
}
