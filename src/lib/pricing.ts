import {
  getSettings,
  SETTING_KEYS,
  parseShippingMode,
  parseVolumeDiscountTiers,
  parseTaxConfig,
  findApplicableTier,
  type ShippingMode,
  type VolumeDiscountTier,
  type TaxConfig,
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
  /** Suma bruta de líneas (sin descuento) */
  subtotalCents: number;
  /** Descuento por volumen aplicado al subtotal completo del carrito */
  discountCents: number;
  discountTier: VolumeDiscountTier | null;
  /** Suma de unidades de todas las líneas */
  totalUnits: number;

  /** Portes (0 si modo 'included') */
  shippingCents: number;
  shippingMode: ShippingMode;
  /** Umbral configurado de portes gratis */
  freeShippingThresholdCents: number;

  /** Base imponible = subtotal − descuento + portes (cuando aplican) */
  taxableBaseCents: number;
  vatPct: number;
  vatCents: number;
  equivSurchargeEnabled: boolean;
  equivSurchargePct: number;
  equivSurchargeCents: number;

  /** Total final con IVA + recargo (lo que paga el cliente) */
  totalCents: number;

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
  const tax: TaxConfig = parseTaxConfig(
    settings[SETTING_KEYS.TAX_VAT_PCT],
    settings[SETTING_KEYS.TAX_EQUIV_SURCHARGE_PCT],
    settings[SETTING_KEYS.TAX_EQUIV_SURCHARGE_ENABLED],
  );

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

  // 1) Descuento por volumen
  const tier = findApplicableTier(totalUnits, tiers);
  const discountCents = tier
    ? Math.round((subtotal * tier.discountPct) / 100)
    : 0;
  const subtotalAfterDiscount = subtotal - discountCents;

  // 2) Portes
  let shipping = 0;
  if (shippingMode === 'separate') {
    shipping = freeThreshold > 0 && subtotalAfterDiscount >= freeThreshold
      ? 0
      : shippingFlat;
  }

  // 3) Base imponible (subtotal con descuento + portes)
  const taxableBase = subtotalAfterDiscount + shipping;

  // 4) IVA
  const vatCents = Math.round((taxableBase * tax.vatPct) / 100);

  // 5) Recargo de equivalencia (opcional)
  const equivSurchargeCents = tax.equivSurchargeEnabled
    ? Math.round((taxableBase * tax.equivSurchargePct) / 100)
    : 0;

  // 6) Total final
  const totalCents = taxableBase + vatCents + equivSurchargeCents;

  return {
    items: priced,
    totals: {
      subtotalCents: subtotal,
      discountCents,
      discountTier: tier,
      totalUnits,
      shippingCents: shipping,
      shippingMode,
      freeShippingThresholdCents: freeThreshold,
      taxableBaseCents: taxableBase,
      vatPct: tax.vatPct,
      vatCents,
      equivSurchargeEnabled: tax.equivSurchargeEnabled,
      equivSurchargePct: tax.equivSurchargePct,
      equivSurchargeCents,
      totalCents,
      meetsMinimum: subtotalAfterDiscount >= minOrder,
      minimumCents: minOrder,
    },
  };
}
