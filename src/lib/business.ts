import { prisma } from './prisma';
import { getSettings, SETTING_KEYS, type SettingKey } from './settings';

/**
 * Motor de cálculo del PANEL DE NEGOCIO.
 *
 * Toma todos los pedidos NO cancelados y NO de prueba, aplica los
 * parámetros de coste configurables y produce:
 *   - agregados globales (ingresos, costes, margen, comisión)
 *   - evolución mensual
 *   - rentabilidad por cliente
 *   - desglose de costes
 *   - amortización de la máquina (recuperado vs precio)
 *
 * Modelo económico (según lo acordado):
 *   Ingreso pulseras = subtotal − descuento  (PVF cobrado, sin IVA)
 *   Ingreso envío    = shippingCents (portes cobrados al cliente)
 *   Costes:
 *     · pulsera en blanco  = coste_color × unidades (por línea)
 *     · grabado            = coste_grabado × unidades
 *     · amortización       = (precio_máquina / vida_uds) × unidades
 *     · envío real         = coste_envío_real (fijo, solo si el pedido
 *                            se envió = tiene trackingNumber)
 *   Tu comisión = comisión_por_unidad × unidades  (lo que ganas tú)
 *   Margen bruto = ingresos − costes
 *   Margen tras comisión = margen bruto − tu comisión
 */

export interface BizParams {
  costBraceletBlackCents: number;
  costBraceletRedCents: number;
  costEngravingCents: number;
  costShippingRealCents: number;
  commissionPerUnitCents: number;
  machinePriceCents: number;
  machineLifeUnits: number;
}

export async function getBizParams(): Promise<BizParams> {
  const s = await getSettings();
  const n = (k: SettingKey, d = 0) => {
    const v = Number(s[k]);
    return Number.isFinite(v) ? v : d;
  };
  return {
    costBraceletBlackCents: n(SETTING_KEYS.BIZ_COST_BRACELET_BLACK_CENTS),
    costBraceletRedCents: n(SETTING_KEYS.BIZ_COST_BRACELET_RED_CENTS),
    costEngravingCents: n(SETTING_KEYS.BIZ_COST_ENGRAVING_CENTS),
    costShippingRealCents: n(SETTING_KEYS.BIZ_COST_SHIPPING_REAL_CENTS),
    commissionPerUnitCents: n(SETTING_KEYS.BIZ_COMMISSION_PER_UNIT_CENTS),
    machinePriceCents: n(SETTING_KEYS.BIZ_MACHINE_PRICE_CENTS),
    machineLifeUnits: Math.max(1, n(SETTING_KEYS.BIZ_MACHINE_LIFE_UNITS, 20000)),
  };
}

export interface BizTotals {
  orders: number;
  units: number;
  incomeBraceletsCents: number;   // PVF cobrado por pulseras (sin IVA, tras descuento)
  incomeShippingCents: number;    // portes cobrados al cliente
  incomeTotalCents: number;       // ingreso total del negocio (sin IVA)
  costBraceletsCents: number;
  costEngravingCents: number;
  costShippingRealCents: number;
  costAmortizationCents: number;
  costTotalCents: number;
  grossMarginCents: number;       // ingresos − costes
  commissionCents: number;        // tu comisión (lo que ganas tú)
  netMarginCents: number;         // margen tras tu comisión
  avgTicketCents: number;         // ingreso medio por pedido
}

export interface MonthlyBiz {
  ym: string;        // "2026-08"
  label: string;     // "ago 2026"
  incomeCents: number;
  costCents: number;
  grossMarginCents: number;
  commissionCents: number;
  units: number;
}

export interface CustomerBiz {
  customerId: string;
  pharmacyName: string;
  cif: string;
  orders: number;
  units: number;
  incomeCents: number;
  costCents: number;
  grossMarginCents: number;
  commissionCents: number;
  avgPvfCents: number;   // PVF medio aplicado (por unidad, sin IVA)
  marginPct: number;     // margen bruto / ingresos × 100
}

export interface AmortizationInfo {
  machinePriceCents: number;
  recoveredCents: number;   // margen bruto acumulado destinado a amortizar
  remainingCents: number;
  pct: number;              // 0-100
  paidOff: boolean;
}

export interface BusinessReport {
  params: BizParams;
  totals: BizTotals;
  monthly: MonthlyBiz[];
  byCustomer: CustomerBiz[];
  amortization: AmortizationInfo;
  costBreakdown: { label: string; cents: number }[];
  hasParams: boolean;   // ¿hay algún parámetro de coste configurado?
}

interface OrderForBiz {
  id: string;
  customerId: string;
  pharmacyName: string;
  cif: string;
  createdAt: Date;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  trackingNumber: string | null;
  items: { color: string; quantity: number }[];
}

function ymOf(date: Date): string {
  // Zona Europe/Madrid para agrupar por mes correctamente
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit',
  });
  return fmt.format(date).slice(0, 7); // "2026-08"
}

function ymLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  return new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(dt);
}

/** Calcula los costes/ingresos de un pedido individual. */
function costsForOrder(o: OrderForBiz, p: BizParams) {
  const units = o.items.reduce((a, b) => a + b.quantity, 0);

  const incomeBracelets = o.subtotalCents - o.discountCents;
  const incomeShipping = o.shippingCents;
  const income = incomeBracelets + incomeShipping;

  let costBracelets = 0;
  for (const it of o.items) {
    const unit = it.color === 'RED' ? p.costBraceletRedCents : p.costBraceletBlackCents;
    costBracelets += unit * it.quantity;
  }
  const costEngraving = p.costEngravingCents * units;
  const costAmort = Math.round((p.machinePriceCents / p.machineLifeUnits) * units);
  // El coste real de envío solo cuenta si el pedido se envió
  const costShippingReal = o.trackingNumber ? p.costShippingRealCents : 0;

  const cost = costBracelets + costEngraving + costAmort + costShippingReal;
  const commission = p.commissionPerUnitCents * units;

  return {
    units,
    incomeBracelets, incomeShipping, income,
    costBracelets, costEngraving, costAmort, costShippingReal, cost,
    commission,
    grossMargin: income - cost,
  };
}

export async function getBusinessReport(): Promise<BusinessReport> {
  const params = await getBizParams();

  const orders = (await prisma.order.findMany({
    where: { status: { not: 'CANCELLED' }, isTest: false },
    select: {
      id: true, customerId: true, pharmacyName: true, cif: true, createdAt: true,
      subtotalCents: true, discountCents: true, shippingCents: true, trackingNumber: true,
      items: { select: { color: true, quantity: true } },
    },
    orderBy: { createdAt: 'asc' },
  })) as OrderForBiz[];

  // Agregados
  const totals: BizTotals = {
    orders: orders.length, units: 0,
    incomeBraceletsCents: 0, incomeShippingCents: 0, incomeTotalCents: 0,
    costBraceletsCents: 0, costEngravingCents: 0, costShippingRealCents: 0,
    costAmortizationCents: 0, costTotalCents: 0,
    grossMarginCents: 0, commissionCents: 0, netMarginCents: 0, avgTicketCents: 0,
  };

  const monthlyMap = new Map<string, MonthlyBiz>();
  const custMap = new Map<string, CustomerBiz>();

  for (const o of orders) {
    const c = costsForOrder(o, params);

    totals.units += c.units;
    totals.incomeBraceletsCents += c.incomeBracelets;
    totals.incomeShippingCents += c.incomeShipping;
    totals.incomeTotalCents += c.income;
    totals.costBraceletsCents += c.costBracelets;
    totals.costEngravingCents += c.costEngraving;
    totals.costShippingRealCents += c.costShippingReal;
    totals.costAmortizationCents += c.costAmort;
    totals.costTotalCents += c.cost;
    totals.grossMarginCents += c.grossMargin;
    totals.commissionCents += c.commission;

    // Mensual
    const ym = ymOf(o.createdAt);
    const mo = monthlyMap.get(ym) ?? {
      ym, label: ymLabel(ym), incomeCents: 0, costCents: 0,
      grossMarginCents: 0, commissionCents: 0, units: 0,
    };
    mo.incomeCents += c.income;
    mo.costCents += c.cost;
    mo.grossMarginCents += c.grossMargin;
    mo.commissionCents += c.commission;
    mo.units += c.units;
    monthlyMap.set(ym, mo);

    // Por cliente
    const cu = custMap.get(o.customerId) ?? {
      customerId: o.customerId, pharmacyName: o.pharmacyName, cif: o.cif,
      orders: 0, units: 0, incomeCents: 0, costCents: 0,
      grossMarginCents: 0, commissionCents: 0, avgPvfCents: 0, marginPct: 0,
    };
    cu.orders += 1;
    cu.units += c.units;
    cu.incomeCents += c.income;
    cu.costCents += c.cost;
    cu.grossMarginCents += c.grossMargin;
    cu.commissionCents += c.commission;
    custMap.set(o.customerId, cu);
  }

  totals.netMarginCents = totals.grossMarginCents - totals.commissionCents;
  totals.avgTicketCents = totals.orders > 0 ? Math.round(totals.incomeTotalCents / totals.orders) : 0;

  // Finalizar por-cliente (avgPvf, marginPct) y ordenar por margen desc
  const byCustomer = Array.from(custMap.values()).map((cu) => ({
    ...cu,
    avgPvfCents: cu.units > 0 ? Math.round((cu.incomeCents - 0) / cu.units) : 0,
    marginPct: cu.incomeCents > 0 ? (cu.grossMarginCents / cu.incomeCents) * 100 : 0,
  })).sort((a, b) => b.grossMarginCents - a.grossMarginCents);

  const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.ym.localeCompare(b.ym));

  // Amortización: el margen bruto acumulado "recupera" el precio de la máquina
  const recovered = Math.max(0, totals.grossMarginCents);
  const machinePrice = params.machinePriceCents;
  const amortization: AmortizationInfo = {
    machinePriceCents: machinePrice,
    recoveredCents: Math.min(recovered, machinePrice || recovered),
    remainingCents: Math.max(0, machinePrice - recovered),
    pct: machinePrice > 0 ? Math.min(100, (recovered / machinePrice) * 100) : 0,
    paidOff: machinePrice > 0 && recovered >= machinePrice,
  };

  const costBreakdown = [
    { label: 'Pulseras en blanco', cents: totals.costBraceletsCents },
    { label: 'Grabado (luz+consumibles)', cents: totals.costEngravingCents },
    { label: 'Envío real', cents: totals.costShippingRealCents },
    { label: 'Amortización máquina', cents: totals.costAmortizationCents },
  ].filter((c) => c.cents > 0);

  const hasParams = [
    params.costBraceletBlackCents, params.costBraceletRedCents, params.costEngravingCents,
    params.costShippingRealCents, params.commissionPerUnitCents, params.machinePriceCents,
  ].some((v) => v > 0);

  return { params, totals, monthly, byCustomer, amortization, costBreakdown, hasParams };
}
