'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { SETTING_KEYS, setSetting } from '@/lib/settings';
import { settingsSchema } from '@/lib/validations';

export interface SaveSettingsState {
  error?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
}

export async function saveSettings(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  const s = await getAdminSession();
  if (!s) redirect('/admin/login');

  const raw = {
    priceBlackCents: euroToCents(formData.get('priceBlackEuros')),
    priceRedCents: euroToCents(formData.get('priceRedEuros')),
    pvprCents: euroToCents(formData.get('pvprEuros')),
    shippingCents: euroToCents(formData.get('shippingEuros')),
    freeShippingThresholdCents: euroToCents(formData.get('freeShippingThresholdEuros')),
    minOrderCents: euroToCents(formData.get('minOrderEuros')),
    minQuantityPerLine: Number(formData.get('minQuantityPerLine')),
    deliveryDays: Number(formData.get('deliveryDays')),
    ordersRecipientEmails: String(formData.get('ordersRecipientEmails') ?? '').trim(),
    maxCharsPerLine: Number(formData.get('maxCharsPerLine')),
    companyName: String(formData.get('companyName') ?? '').trim(),
    companyPhone: String(formData.get('companyPhone') ?? '').trim(),
    companyEmail: String(formData.get('companyEmail') ?? '').trim(),
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe };
  }

  const v = parsed.data;
  await Promise.all([
    setSetting(SETTING_KEYS.PRICE_BLACK_CENTS, String(v.priceBlackCents)),
    setSetting(SETTING_KEYS.PRICE_RED_CENTS, String(v.priceRedCents)),
    setSetting(SETTING_KEYS.PVPR_CENTS, String(v.pvprCents)),
    setSetting(SETTING_KEYS.SHIPPING_CENTS, String(v.shippingCents)),
    setSetting(SETTING_KEYS.FREE_SHIPPING_THRESHOLD_CENTS, String(v.freeShippingThresholdCents)),
    setSetting(SETTING_KEYS.MIN_ORDER_CENTS, String(v.minOrderCents)),
    setSetting(SETTING_KEYS.MIN_QUANTITY_PER_LINE, String(v.minQuantityPerLine)),
    setSetting(SETTING_KEYS.DELIVERY_DAYS, String(v.deliveryDays)),
    setSetting(SETTING_KEYS.ORDERS_RECIPIENT_EMAILS, v.ordersRecipientEmails),
    setSetting(SETTING_KEYS.MAX_CHARS_PER_LINE, String(v.maxCharsPerLine)),
    setSetting(SETTING_KEYS.COMPANY_NAME, v.companyName),
    setSetting(SETTING_KEYS.COMPANY_PHONE, v.companyPhone ?? ''),
    setSetting(SETTING_KEYS.COMPANY_EMAIL, v.companyEmail),
  ]);

  revalidatePath('/admin/configuracion');
  revalidatePath('/tienda');
  revalidatePath('/tienda/carrito');
  revalidatePath('/');
  return { ok: true };
}

function euroToCents(v: FormDataEntryValue | null): number {
  if (v == null) return 0;
  const s = String(v).replace(',', '.').trim();
  const n = Math.round(Number(s) * 100);
  return Number.isFinite(n) ? n : 0;
}
