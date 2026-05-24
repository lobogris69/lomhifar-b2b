import { ColorBreakdown } from '@/lib/stats';
import { colorLabel } from '@/lib/cart';

/**
 * Tarjeta con distribución de unidades fabricadas por color.
 * Barras horizontales proporcionales.
 */
export function ColorBreakdownCard({ data }: { data: ColorBreakdown[] }) {
  const total = data.reduce((a, b) => a + b.units, 0);

  return (
    <div className="card p-6">
      <h3 className="text-base font-semibold text-ink-900">Pulseras por color</h3>
      <p className="text-xs text-ink-500 mb-4">{total} unidades fabricadas (no canceladas)</p>

      {data.length === 0 ? (
        <p className="text-sm text-ink-500">Aún no hay pulseras fabricadas.</p>
      ) : (
        <div className="space-y-4">
          {data.map((b) => {
            const pct = total > 0 ? (b.units / total) * 100 : 0;
            const isBlack = b.color === 'BLACK';
            const swatch = isBlack ? 'bg-ink-950' : 'bg-red-700';
            const bar = isBlack
              ? 'bg-gradient-to-r from-ink-700 to-ink-950'
              : 'bg-gradient-to-r from-red-500 to-red-800';

            return (
              <div key={b.color}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`h-4 w-4 rounded-full ${swatch} border border-ink-300`} />
                    <span className="font-medium text-ink-900">{colorLabel(b.color)}</span>
                    <span className="text-xs text-ink-500">· {b.lines} líneas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-ink-900">{b.units}</span>
                    <span className="text-xs text-ink-500 ml-1">({pct.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bar} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
