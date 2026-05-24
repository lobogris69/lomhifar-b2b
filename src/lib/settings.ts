import { prisma } from './prisma';

/**
 * Claves de configuración del sistema (centralizadas para evitar typos).
 */
export const SETTING_KEYS = {
  PRICE_BLACK_CENTS: 'price.black.cents',
  PRICE_RED_CENTS: 'price.red.cents',
  PVPR_CENTS: 'price.pvpr.cents',
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
  CONFIGURATOR_AREA_BLACK: 'configurator.bracelet_black.area_json',
  CONFIGURATOR_AREA_RED: 'configurator.bracelet_red.area_json',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  [SETTING_KEYS.PRICE_BLACK_CENTS]: '350', // 3,50 €
  [SETTING_KEYS.PRICE_RED_CENTS]: '350',
  [SETTING_KEYS.PVPR_CENTS]: '2495', // 24,95 € PVP recomendado al paciente
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
  // Área de impresión en % (left, top, width, height) + rotación grados + color del láser
  // Default pensado para placa típica con SÍMBOLO médico a la izquierda y
  // hueco de grabado a la derecha (formato más común de las pulseras médicas).
  // textColor = tono típico del grabado láser sobre aluminio pulido sin pintar:
  // un gris frostado similar al de la propia "Estrella de la Vida" estampada.
  [SETTING_KEYS.CONFIGURATOR_AREA_BLACK]: JSON.stringify({
    leftPct: 50, topPct: 42, widthPct: 22, heightPct: 14, rotationDeg: 0, textColor: '#7d7d80',
  }),
  [SETTING_KEYS.CONFIGURATOR_AREA_RED]: JSON.stringify({
    leftPct: 50, topPct: 42, widthPct: 22, heightPct: 14, rotationDeg: 0, textColor: '#7d7d80',
  }),
};

export interface PrintArea {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  rotationDeg: number;
  textColor: string;
}

export const DEFAULT_PRINT_AREA: PrintArea = {
  leftPct: 50, topPct: 42, widthPct: 22, heightPct: 14, rotationDeg: 0, textColor: '#7d7d80',
};

/**
 * Colores típicos de grabado láser sobre aluminio sin pintura (presets admin).
 * El láser ablaciona la superficie del aluminio creando una textura mate
 * más oscura que el pulido circundante. El tono real depende del acabado
 * del aluminio (pulido, cepillado) y de la intensidad del láser.
 */
export const ENGRAVING_PRESETS = [
  { label: 'Aluminio pulido (suave)', value: '#8a8a8c', description: 'Tono claro tipo "Estrella de la Vida"' },
  { label: 'Aluminio pulido (medio)', value: '#7d7d80', description: 'Default: grabado láser estándar' },
  { label: 'Aluminio cepillado', value: '#6d6d72', description: 'Algo más oscuro, contrastado' },
  { label: 'Grabado profundo', value: '#5e5e62', description: 'Para placas con más pase de láser' },
] as const;

export function parsePrintArea(raw: string | undefined): PrintArea {
  if (!raw) return DEFAULT_PRINT_AREA;
  try {
    const obj = JSON.parse(raw);
    return {
      leftPct: clampNum(obj.leftPct, 0, 100, DEFAULT_PRINT_AREA.leftPct),
      topPct: clampNum(obj.topPct, 0, 100, DEFAULT_PRINT_AREA.topPct),
      widthPct: clampNum(obj.widthPct, 1, 100, DEFAULT_PRINT_AREA.widthPct),
      heightPct: clampNum(obj.heightPct, 1, 100, DEFAULT_PRINT_AREA.heightPct),
      rotationDeg: clampNum(obj.rotationDeg, -180, 180, DEFAULT_PRINT_AREA.rotationDeg),
      textColor: typeof obj.textColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(obj.textColor)
        ? obj.textColor
        : DEFAULT_PRINT_AREA.textColor,
    };
  } catch {
    return DEFAULT_PRINT_AREA;
  }
}

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

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
