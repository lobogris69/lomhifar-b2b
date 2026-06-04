import { Package, AlertTriangle, TrendingUp, TrendingDown, Settings2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { ensureStockBase } from '@/lib/stock';
import { formatDate } from '@/lib/utils';
import { colorLabel } from '@/lib/cart';
import { Alert } from '@/components/ui/Alert';
import { AdjustStockForm } from './StockForms';
import { updateMinAlert } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Stock Â· Admin Lomhifar' };

export default async function StockPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  await ensureStockBase();

  const [stocks, recentMovements] = await Promise.all([
    prisma.stock.findMany({ orderBy: { color: 'asc' } }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { stock: true },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Package className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Stock de pulseras</h1>
          <p className="section-subtitle">
            Inventario por color. Se decrementa automÃ¡ticamente con cada pedido.
            Se envÃ­a email al admin si baja del nivel de alerta.
          </p>
        </div>
      </div>

      {/* Tarjetas por color */}
      <div className="grid md:grid-cols-2 gap-6">
        {stocks.map((s) => {
          const color = s.color as 'BLACK' | 'RED';
          const isEmpty = s.quantity <= 0;
          const isLow = s.quantity <= s.minAlertLevel && !isEmpty;
          const swatchBg = color === 'BLACK' ? 'bg-ink-950' : 'bg-red-700';
          return (
            <div key={s.id} className="card overflow-hidden">
              <div className="p-6 flex items-center gap-4 border-b border-ink-100">
                <span className={`h-14 w-14 rounded-full ${swatchBg} shadow-inner border-2 border-white ring-2 ring-ink-100 shrink-0`} />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-ink-900">Pulsera {colorLabel(s.color)}</h2>
                  <p className="text-xs text-ink-500">
                    Nivel mÃ­nimo de alerta: {s.minAlertLevel} unidades
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-semibold ${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-ink-900'}`}>
                    {s.quantity.toLocaleString('es-ES')}
                  </div>
                  <div className="text-xs text-ink-500 uppercase tracking-wider">en stock</div>
                </div>
              </div>

              {isEmpty && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-sm text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span><strong>Stock agotado.</strong> Los clientes ven un aviso en el configurador.</span>
                </div>
              )}
              {isLow && (
                <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span><strong>Stock bajo.</strong> Conviene reponer pronto.</span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-sm font-semibold text-ink-900 mb-3 flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5" /> Registrar movimiento
                </h3>
                <AdjustStockForm color={color} />
              </div>

              <details className="px-6 pb-4 border-t border-ink-100">
                <summary className="text-xs text-ink-500 cursor-pointer py-2 hover:text-ink-700">
                  Configurar nivel mÃ­nimo de alerta
                </summary>
                <form action={updateMinAlert} className="mt-2 flex items-end gap-2">
                  <input type="hidden" name="color" value={color} />
                  <div className="flex-1">
                    <label className="text-xs text-ink-500" htmlFor={`min-${color}`}>Nivel mÃ­nimo</label>
                    <input
                      id={`min-${color}`}
                      name="minAlertLevel"
                      type="number"
                      min="0"
                      defaultValue={s.minAlertLevel}
                      className="input"
                    />
                  </div>
                  <button type="submit" className="btn-secondary text-xs">Guardar</button>
                </form>
              </details>
            </div>
          );
        })}
      </div>

      {/* Movimientos recientes */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100">
          <h2 className="text-base font-semibold text-ink-900">Movimientos recientes</h2>
        </div>
        {recentMovements.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-500">
            AÃºn no hay movimientos. Registra una entrada arriba para empezar a llevar el control.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="table-pro min-w-[720px]">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Color</th>
                <th className="text-right">Cantidad</th>
                <th>Motivo</th>
                <th>Nota</th>
                <th>Por</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.map((m) => (
                <tr key={m.id}>
                  <td className="text-xs">{formatDate(m.createdAt)}</td>
                  <td>{colorLabel(m.stock.color)}</td>
                  <td className={`text-right font-mono font-semibold ${m.delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    <span className="inline-flex items-center gap-1">
                      {m.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {m.delta > 0 ? '+' : ''}{m.delta}
                    </span>
                  </td>
                  <td className="text-xs">
                    <span className="badge-muted">{m.reason}</span>
                  </td>
                  <td className="text-xs text-ink-600 max-w-xs truncate">{m.note ?? 'â€”'}</td>
                  <td className="text-xs text-ink-500">
                    {m.reason === 'PEDIDO' ? 'Sistema' : m.createdBy ?? 'â€”'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
