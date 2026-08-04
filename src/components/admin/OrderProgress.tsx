import { Check, Inbox, Zap, Truck, PackageCheck, Ban, PauseCircle } from 'lucide-react';

interface Props {
  status: string;
  engravedAt?: Date | null;
  trackingNumber?: string | null;
}

/**
 * Barra de progreso lineal del pedido:
 *   ① Recibido → ② Grabado → ③ Enviado → ④ Entregado
 *
 * Los estados CANCELLED y ON_HOLD se muestran como aviso aparte (no
 * encajan en la línea de progreso normal).
 */
export function OrderProgress({ status, engravedAt, trackingNumber }: Props) {
  // Estado especial: cancelado o en espera → banner en vez de barra
  if (status === 'CANCELLED') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2 text-sm text-red-800">
        <Ban className="h-4 w-4" />
        <strong>Pedido cancelado.</strong>
      </div>
    );
  }

  const engravedDone = Boolean(engravedAt) ||
    ['IN_PREPARATION', 'SHIPPED', 'DELIVERED', 'INVOICED'].includes(status);
  const shippedDone = Boolean(trackingNumber) ||
    ['SHIPPED', 'DELIVERED'].includes(status);
  const deliveredDone = status === 'DELIVERED';

  const steps = [
    { key: 'received', label: 'Recibido', icon: Inbox, done: true },
    { key: 'engraved', label: 'Grabado', icon: Zap, done: engravedDone },
    { key: 'shipped', label: 'Enviado', icon: Truck, done: shippedDone },
    { key: 'delivered', label: 'Entregado', icon: PackageCheck, done: deliveredDone },
  ];

  // El paso "actual" es el primero no completado
  const currentIdx = steps.findIndex((s) => !s.done);

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      {status === 'ON_HOLD' && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 flex items-center gap-2 text-xs text-amber-800">
          <PauseCircle className="h-3.5 w-3.5" />
          <strong>En espera</strong> — el pedido está pausado.
        </div>
      )}
      <div className="flex items-center">
        {steps.map((step, i) => {
          const isCurrent = i === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                    step.done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'bg-ink-50 border-ink-200 text-ink-300'
                  }`}
                >
                  {step.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={`text-[11px] font-medium whitespace-nowrap ${
                    step.done ? 'text-emerald-700' : isCurrent ? 'text-brand-700' : 'text-ink-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 sm:mx-2 -mt-4 ${
                    steps[i + 1].done || step.done ? 'bg-emerald-400' : 'bg-ink-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
