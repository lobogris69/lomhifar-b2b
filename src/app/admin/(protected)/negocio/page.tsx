import {
  TrendingUp, Wallet, PiggyBank, Coins, Package2, Receipt,
  Cpu, Users, BarChart3, PieChart, Info,
} from 'lucide-react';
import { getBusinessReport } from '@/lib/business';
import { formatEuros } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { BizParamsForm } from './BizParamsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Control de negocio · Admin Lomhifar' };

export default async function BusinessPage() {
  const r = await getBusinessReport();
  const { totals, monthly, byCustomer, amortization, costBreakdown, params, hasParams } = r;

  const maxMonthly = Math.max(1, ...monthly.map((m) => Math.max(m.incomeCents, m.costCents)));
  const totalCostForBreakdown = Math.max(1, costBreakdown.reduce((a, b) => a + b.cents, 0));

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Control de negocio</h1>
          <p className="section-subtitle">
            Rentabilidad real: ingresos, costes, tu comisión y amortización de la máquina.
          </p>
        </div>
      </div>

      {!hasParams && (
        <Alert variant="warning" title="Configura tus costes para ver la rentabilidad real">
          <p className="text-sm">
            Aún no has puesto los costes (pulsera, grabado, envío, comisión, máquina).
            Mientras estén a cero, el «margen» es igual a los ingresos. Rellénalos abajo
            en <strong>«Parámetros de coste»</strong> y todos los cálculos se actualizarán.
          </p>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Wallet} label="Ingresos (sin IVA)" value={formatEuros(totals.incomeTotalCents)}
          sub={`${totals.orders} pedidos`} tone="ink" />
        <Kpi icon={Receipt} label="Costes totales" value={formatEuros(totals.costTotalCents)}
          sub={`${totals.units} pulseras`} tone="red" />
        <Kpi icon={TrendingUp} label="Margen bruto" value={formatEuros(totals.grossMarginCents)}
          sub={totals.incomeTotalCents > 0 ? `${((totals.grossMarginCents / totals.incomeTotalCents) * 100).toFixed(0)}% sobre ingresos` : '—'}
          tone={totals.grossMarginCents >= 0 ? 'emerald' : 'red'} />
        <Kpi icon={Coins} label="Tu comisión" value={formatEuros(totals.commissionCents)}
          sub={`${formatEuros(params.commissionPerUnitCents)}/pulsera`} tone="brand" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={PiggyBank} label="Margen tras tu comisión" value={formatEuros(totals.netMarginCents)}
          sub="lo que queda tras pagarte" tone={totals.netMarginCents >= 0 ? 'emerald' : 'red'} />
        <Kpi icon={Package2} label="Ingreso medio / pedido" value={formatEuros(totals.avgTicketCents)}
          sub="ticket medio" tone="ink" />
        <Kpi icon={Coins} label="Ingreso pulseras" value={formatEuros(totals.incomeBraceletsCents)}
          sub="PVF cobrado (sin portes)" tone="ink" />
        <Kpi icon={Package2} label="Portes cobrados" value={formatEuros(totals.incomeShippingCents)}
          sub={`coste real ${formatEuros(totals.costShippingRealCents)}`} tone="ink" />
      </div>

      {/* Amortización de la máquina */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-brand-700" />
          <h2 className="text-sm font-semibold text-ink-900">Amortización de la máquina</h2>
        </div>
        {params.machinePriceCents > 0 ? (
          <>
            <div className="flex items-baseline justify-between text-sm mb-2 flex-wrap gap-2">
              <span className="text-ink-600">
                Máquina: <strong>{formatEuros(params.machinePriceCents)}</strong>
                {' · '}Recuperado con el margen: <strong className="text-emerald-700">{formatEuros(amortization.recoveredCents)}</strong>
              </span>
              <span className={amortization.paidOff ? 'text-emerald-700 font-semibold' : 'text-ink-600'}>
                {amortization.paidOff
                  ? '✓ ¡Máquina amortizada!'
                  : `Faltan ${formatEuros(amortization.remainingCents)}`}
              </span>
            </div>
            <div className="h-4 rounded-full bg-ink-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${amortization.paidOff ? 'bg-emerald-500' : 'bg-brand-gradient'}`}
                style={{ width: `${amortization.pct.toFixed(1)}%` }}
              />
            </div>
            <div className="mt-1 text-right text-xs text-ink-500">{amortization.pct.toFixed(0)}%</div>
            <p className="mt-2 text-[11px] text-ink-500">
              Coste de amortización repartido: {formatEuros(Math.round(params.machinePriceCents / params.machineLifeUnits))} por pulsera
              ({params.machineLifeUnits.toLocaleString('es-ES')} pulseras de vida útil).
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-500">
            Introduce el precio de la máquina en «Parámetros de coste» para ver cuándo se paga sola.
          </p>
        )}
      </div>

      {/* Evolución mensual */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-brand-700" />
          <h2 className="text-sm font-semibold text-ink-900">Evolución mensual</h2>
          <div className="ml-auto flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-500" /> Ingresos</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" /> Costes</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Margen</span>
          </div>
        </div>
        {monthly.length === 0 ? (
          <p className="text-sm text-ink-500 text-center py-6">Aún no hay pedidos para mostrar evolución.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-4 min-w-[400px] h-[180px]">
              {monthly.map((m) => (
                <div key={m.ym} className="flex-1 flex flex-col items-center gap-1 min-w-[48px]">
                  <div className="flex items-end justify-center gap-0.5 w-full flex-1">
                    <Bar cents={m.incomeCents} max={maxMonthly} color="bg-brand-500" />
                    <Bar cents={m.costCents} max={maxMonthly} color="bg-red-400" />
                    <Bar cents={m.grossMarginCents} max={maxMonthly} color="bg-emerald-500" />
                  </div>
                  <div className="text-[10px] text-ink-500 whitespace-nowrap">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desglose de costes */}
      {costBreakdown.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="h-4 w-4 text-brand-700" />
            <h2 className="text-sm font-semibold text-ink-900">Desglose de costes</h2>
          </div>
          <div className="space-y-2">
            {costBreakdown.map((c) => {
              const pct = (c.cents / totalCostForBreakdown) * 100;
              return (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-ink-700">{c.label}</span>
                    <span className="text-ink-900 font-medium">{formatEuros(c.cents)} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rentabilidad por cliente */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-ink-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-700" />
          <h2 className="text-sm font-semibold text-ink-900">Rentabilidad por cliente</h2>
        </div>
        {byCustomer.length === 0 ? (
          <p className="p-6 text-sm text-ink-500 text-center">Aún no hay pedidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-pro min-w-[720px]">
              <thead>
                <tr>
                  <th>Farmacia</th>
                  <th className="text-right">Pedidos</th>
                  <th className="text-right">Pulseras</th>
                  <th className="text-right">PVF medio/ud</th>
                  <th className="text-right">Ingresos</th>
                  <th className="text-right">Margen</th>
                  <th className="text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {byCustomer.map((c) => (
                  <tr key={c.customerId}>
                    <td className="font-medium">{c.pharmacyName}</td>
                    <td className="text-right">{c.orders}</td>
                    <td className="text-right">{c.units}</td>
                    <td className="text-right font-mono text-xs">{formatEuros(c.avgPvfCents)}</td>
                    <td className="text-right">{formatEuros(c.incomeCents)}</td>
                    <td className={`text-right font-semibold ${c.grossMarginCents >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatEuros(c.grossMarginCents)}
                    </td>
                    <td className="text-right text-xs">{c.marginPct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Parámetros de coste (editable) */}
      <BizParamsForm
        initialValues={{
          costBlack: params.costBraceletBlackCents / 100,
          costRed: params.costBraceletRedCents / 100,
          costEngraving: params.costEngravingCents / 100,
          costShipping: params.costShippingRealCents / 100,
          commission: params.commissionPerUnitCents / 100,
          machinePrice: params.machinePriceCents / 100,
          machineLife: params.machineLifeUnits,
        }}
      />

      <p className="text-[11px] text-ink-400 flex items-start gap-1">
        <Info className="h-3 w-3 shrink-0 mt-0.5" />
        Los pedidos cancelados y los de prueba NO cuentan. Los ingresos son sin IVA
        (el IVA no es tuyo, se paga a Hacienda). El coste real de envío solo se cuenta
        en pedidos que ya se han enviado (tienen nº de seguimiento).
      </p>
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, sub, tone,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  tone: 'ink' | 'emerald' | 'red' | 'brand';
}) {
  const toneCls = {
    ink: 'text-ink-900',
    emerald: 'text-emerald-700',
    red: 'text-red-700',
    brand: 'text-brand-700',
  }[tone];
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-500">{label}</span>
        <Icon className="h-4 w-4 text-ink-400" />
      </div>
      <div className={`mt-2 text-xl font-semibold ${toneCls}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-500">{sub}</div>}
    </div>
  );
}

function Bar({ cents, max, color }: { cents: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (cents / max) * 100));
  return (
    <div className="w-2.5 sm:w-3 bg-ink-100 rounded-t self-end" style={{ height: '100%' }}>
      <div
        className={`${color} rounded-t w-full`}
        style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
        title={formatEuros(cents)}
      />
    </div>
  );
}
