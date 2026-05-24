import { cookies } from 'next/headers';
import { BraceletColor } from './enums';
import { z } from 'zod';

const CART_COOKIE = 'lomhifar_cart';
const MAX_ITEMS = 50;

export const cartItemSchema = z.object({
  id: z.string(),
  color: z.enum(['BLACK', 'RED']),
  quantity: z.number().int().min(1).max(9999),
  line1: z.string().max(40),
  line2: z.string().max(40),
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

export function addToCart(item: Omit<CartItem, 'id'>): CartItem[] {
  const cart = readCart();
  cart.push({ ...item, id: newCartItemId() });
  writeCart(cart);
  return cart;
}

export function removeCartItem(id: string): CartItem[] {
  const cart = readCart().filter((i) => i.id !== id);
  writeCart(cart);
  return cart;
}

export function colorLabel(color: BraceletColor): string {
  return color === 'BLACK' ? 'Negra' : 'Roja';
}
