import { z } from 'zod';

const NIE_REGEX = /^[XYZxyz]\d{7}[A-Za-z]$/;
const NIF_REGEX = /^\d{8}[A-Za-z]$/;
const CIF_REGEX = /^[ABCDEFGHJKLMNPQRSUVWabcdefghjklmnpqrsuvw]\d{7}[A-Za-z0-9]$/;

export function isValidSpanishTaxId(value: string): boolean {
  const v = value.trim().toUpperCase().replace(/[\s\-_.]/g, '');
  return CIF_REGEX.test(v) || NIF_REGEX.test(v) || NIE_REGEX.test(v);
}

export function normalizeIban(value: string): string {
  return value.replace(/[\s\-]/g, '').toUpperCase();
}

/**
 * Validación básica de IBAN español (ES + 22 dígitos).
 * Para producción se podría reforzar con mod-97 checksum, pero la longitud
 * y formato ES son suficientes para el alta inicial.
 */
export function isValidSpanishIban(value: string): boolean {
  const v = normalizeIban(value);
  return /^ES\d{22}$/.test(v);
}

export const loginSchema = z.object({
  cif: z
    .string()
    .min(8, 'El CIF/NIF es obligatorio')
    .max(20)
    .refine(isValidSpanishTaxId, 'Formato de CIF/NIF/NIE no válido'),
  email: z.string().email('Email no válido').max(120),
});

export const codeSchema = z.object({
  code: z
    .string()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6)
    .regex(/^\d{6}$/, 'El código debe contener 6 dígitos'),
});

export const applicationSchema = z.object({
  cif: z
    .string()
    .min(8, 'El CIF/NIF es obligatorio')
    .max(20)
    .refine(isValidSpanishTaxId, 'Formato de CIF/NIF/NIE no válido'),
  email: z.string().email('Email no válido'),
  pharmacyName: z.string().min(2, 'Nombre de la farmacia obligatorio').max(200),
  contactName: z.string().min(2, 'Persona de contacto obligatoria').max(120),
  phone: z.string().min(9, 'Teléfono obligatorio').max(20),
  whatsapp: z
    .string()
    .max(20)
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || /^[\d\s+().-]{9,20}$/.test(v),
      'WhatsApp no válido',
    ),
  address: z.string().min(3, 'Dirección obligatoria').max(200),
  city: z.string().min(2, 'Localidad obligatoria').max(120),
  postalCode: z.string().min(4, 'C.P. obligatorio').max(10),
  province: z.string().min(2, 'Provincia obligatoria').max(80),
  bankAccount: z
    .string()
    .min(24, 'IBAN obligatorio')
    .max(34)
    .refine(isValidSpanishIban, 'IBAN español no válido (debe empezar por ES + 22 dígitos)'),
  message: z.string().max(1000).optional().or(z.literal('')),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const bracelectColorSchema = z.enum(['BLACK', 'RED']);

export const cartItemSchema = z.object({
  color: bracelectColorSchema,
  quantity: z.number().int().min(1).max(9999),
  line1: z.string().min(1, 'La línea 1 es obligatoria').max(40),
  line2: z.string().max(40),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Debes confirmar que los datos son correctos' }),
  }),
});

export const settingsSchema = z.object({
  priceBlackCents: z.coerce.number().int().min(0).max(1_000_000),
  priceRedCents: z.coerce.number().int().min(0).max(1_000_000),
  pvprCents: z.coerce.number().int().min(0).max(1_000_000),
  shippingCents: z.coerce.number().int().min(0).max(1_000_000),
  freeShippingThresholdCents: z.coerce.number().int().min(0).max(10_000_000),
  minOrderCents: z.coerce.number().int().min(0).max(10_000_000),
  minQuantityPerLine: z.coerce.number().int().min(1).max(9999),
  deliveryDays: z.coerce.number().int().min(1).max(120),
  ordersRecipientEmails: z.string().min(3),
  maxCharsPerLine: z.coerce.number().int().min(5).max(60),
  companyName: z.string().min(2).max(120),
  companyPhone: z.string().max(40).optional().or(z.literal('')),
  companyEmail: z.string().email(),
});
