import { formatEuros } from '@/lib/utils';
import { MonthBucket } from '@/lib/stats';

/**
 * Mini gráfico de barras SVG (sin librerías). Muestra count + facturación por mes.
 */
export function MonthlyChart({ data }: { data: MonthBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const totalRevenue = data.reduce((a, b) => a + b.totalCents, 0);
  const totalCount = data.reduce((a, b) => a + b.count, 0);

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-base font-semibold text-ink-900">Pedidos por mes</h3>
        <div className="text-xs text-ink-500">Últimos {data.length} meses</div>
      </div>
      <div className="text-xs text-ink-500 mb-5">
        <span className="font-semibold text-ink-900">{totalCount}</span> pedidos
        {' · '}
        <span className="font-semibold text-ink-900">{formatEuros(totalRevenue)}</span> facturado
      </div>

      <div className="flex items-end gap-2 h-40">
        {data.map((b) => {
          const h = (b.count / max) * 100;
          return (
            <div key={b.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full bg-brand-gradient rounded-t-md transition-all"
                  style={{ height: `${Math.max(2, h)}%` }}
                  title={`${b.count} pedidos · ${formatEuros(b.totalCents)}`}
                />
              </div>
              <div className="text-[10px] text-ink-500 uppercase tracking-wider">{b.label}</div>
              <div className="text-xs font-semibold text-ink-900">{b.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
