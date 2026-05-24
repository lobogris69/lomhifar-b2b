import { BraceletColor } from './enums';
import { getSettings, SETTING_KEYS } from './settings';

export interface PricedItem {
  color: BraceletColor;
  quantity: number;
  line1: string;
  line2: string;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface OrderTotals {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  freeShippingThresholdCents: number;
  meetsMinimum: boolean;
  minimumCents: number;
}

export async function priceCart(
  items: { color: BraceletColor; quantity: number; line1: string; line2: string }[],
): Promise<{ items: PricedItem[]; totals: OrderTotals }> {
  const settings = await getSettings();
  const priceBlack = Number(settings[SETTING_KEYS.PRICE_BLACK_CENTS]);
  const priceRed = Number(settings[SETTING_KEYS.PRICE_RED_CENTS]);
  const shippingFlat = Number(settings[SETTING_KEYS.SHIPPING_CENTS]);
  const freeThreshold = Number(settings[SETTING_KEYS.FREE_SHIPPING_THRESHOLD_CENTS]);
  const minOrder = Number(settings[SETTING_KEYS.MIN_ORDER_CENTS]);

  const priced: PricedItem[] = items.map((it) => {
    const unit = it.color === 'BLACK' ? priceBlack : priceRed;
    return {
      ...it,
      unitPriceCents: unit,
      lineTotalCents: unit * it.quantity,
    };
  });

  const subtotal = priced.reduce((a, b) => a + b.lineTotalCents, 0);
  const shipping = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : shippingFlat;

  return {
    items: priced,
    totals: {
      subtotalCents: subtotal,
      shippingCents: shipping,
      totalCents: subtotal + shipping,
      freeShippingThresholdCents: freeThreshold,
      meetsMinimum: subtotal >= minOrder,
      minimumCents: minOrder,
    },
  };
}
