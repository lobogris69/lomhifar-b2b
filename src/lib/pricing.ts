import {
  getSettings,
  SETTING_KEYS,
  parseShippingMode,
  parseVolumeDiscountTiers,
  findApplicableTier,
  type ShippingMode,
  type VolumeDiscountTier,
} from './settings';

export interface PricedItem {
  color: string;            // "BLACK" | "RED"
  quantity: number;
  line1: string;
  line2: string;
  line3: string;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface OrderTotals {
  subtotalCents: number;
  /**
   * Descuento por volumen aplicado al subtotal completo del carrito
   * (basado en el número TOTAL de unidades de todas las líneas).
   */
  discountCents: number;
  discountTier: VolumeDiscountTier | null;
  /** Suma de unidades de todas las líneas del carrito */
  totalUnits: number;

  shippingCents: number;
  shippingMode: ShippingMode;
  totalCents: number;
  freeShippingThresholdCents: number;
  meetsMinimum: boolean;
  minimumCents: number;
}

export async function priceCart(
  items: { color: string; quantity: number; line1: string; line2: string; line3?: string }[],
): Promise<{ items: PricedItem[]; totals: OrderTotals }> {
  const settings = await getSettings();
  const priceBlack = Number(settings[SETTING_KEYS.PRICE_BLACK_CENTS]);
  const priceRed = Number(settings[SETTING_KEYS.PRICE_RED_CENTS]);
  const shippingFlat = Number(settings[SETTING_KEYS.SHIPPING_CENTS]);
  const freeThreshold = Number(settings[SETTING_KEYS.FREE_SHIPPING_THRESHOLD_CENTS]);
  const minOrder = Number(settings[SETTING_KEYS.MIN_ORDER_CENTS]);

  const shippingMode = parseShippingMode(settings[SETTING_KEYS.SHIPPING_MODE]);
  const tiers = parseVolumeDiscountTiers(settings[SETTING_KEYS.VOLUME_DISCOUNT_TIERS_JSON]);

  const priced: PricedItem[] = items.map((it) => {
    const unit = it.color === 'BLACK' ? priceBlack : priceRed;
    return {
      color: it.color,
      quantity: it.quantity,
      line1: it.line1,
      line2: it.line2,
      line3: it.line3 ?? '',
      unitPriceCents: unit,
      lineTotalCents: unit * it.quantity,
    };
  });

  const subtotal = priced.reduce((a, b) => a + b.lineTotalCents, 0);
  const totalUnits = priced.reduce((a, b) => a + b.quantity, 0);

  // Descuento por volumen sobre el subtotal del carrito
  const tier = findApplicableTier(totalUnits, tiers);
  const discountCents = tier
    ? Math.round((subtotal * tier.discountPct) / 100)
    : 0;
  const subtotalAfterDiscount = subtotal - discountCents;

  // Portes según modo
  let shipping = 0;
  if (shippingMode === 'separate') {
    shipping = freeThreshold > 0 && subtotalAfterDiscount >= freeThreshold
      ? 0
      : shippingFlat;
  }
  // En modo 'included' → siempre 0 (los portes van dentro del precio unitario)

  return {
    items: priced,
    totals: {
      subtotalCents: subtotal,
      discountCents,
      discountTier: tier,
      totalUnits,
      shippingCents: shipping,
      shippingMode,
      totalCents: subtotalAfterDiscount + shipping,
      freeShippingThresholdCents: freeThreshold,
      meetsMinimum: subtotalAfterDiscount >= minOrder,
      minimumCents: minOrder,
    },
  };
}
