import { prisma } from './prisma';

/**
 * Claves de configuración del sistema (centralizadas para evitar typos).
 */
export const SETTING_KEYS = {
  PRICE_BLACK_CENTS: 'price.black.cents',
  PRICE_RED_CENTS: 'price.red.cents',
  SHIPPING_CENTS: 'shipping.cents',
  FREE_SHIPPING_THRESHOLD_CENTS: 'shipping.free_threshold.cents',
  MIN_ORDER_CENTS: 'order.minimum.cents',
  MIN_QUANTITY_PER_LINE: 'order.minimum_quantity_per_line',
  DELIVERY_DAYS: 'order.delivery_days',
  ORDERS_RECIPIENT_EMAILS: 'emails.orders_recipients',
  MAX_CHARS_PER_LINE: 'engraving.max_chars',
  COMPANY_NAME: 'company.name',
  COMPANY_PHONE: 'company.phone',
  COMPANY_EMAIL: 'company.email',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  [SETTING_KEYS.PRICE_BLACK_CENTS]: '350', // 3,50 €
  [SETTING_KEYS.PRICE_RED_CENTS]: '350',
  [SETTING_KEYS.SHIPPING_CENTS]: '595', // 5,95 €
  [SETTING_KEYS.FREE_SHIPPING_THRESHOLD_CENTS]: '5000', // 50 €
  [SETTING_KEYS.MIN_ORDER_CENTS]: '0',
  [SETTING_KEYS.MIN_QUANTITY_PER_LINE]: '1',
  [SETTING_KEYS.DELIVERY_DAYS]: '7',
  [SETTING_KEYS.ORDERS_RECIPIENT_EMAILS]:
    process.env.ORDERS_RECIPIENT_EMAILS ?? 'pedidos@lomhifar.com',
  [SETTING_KEYS.MAX_CHARS_PER_LINE]: '14',
  [SETTING_KEYS.COMPANY_NAME]: 'Lomhifar',
  [SETTING_KEYS.COMPANY_PHONE]: '',
  [SETTING_KEYS.COMPANY_EMAIL]: 'pedidos@lomhifar.com',
};

export async function getSetting(key: SettingKey): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (row) return row.value;
  return DEFAULT_SETTINGS[key];
}

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await prisma.setting.findMany();
  const out: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    out[row.key] = row.value;
  }
  return out as Record<SettingKey, string>;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function ensureDefaultSettings(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }
}

export function parseRecipients(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}
