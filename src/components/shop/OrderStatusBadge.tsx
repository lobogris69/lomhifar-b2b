import { OrderStatus } from '@/lib/enums';
import { cn } from '@/lib/utils';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: 'Recibido',
  ON_HOLD: 'En espera',
  IN_PREPARATION: 'En preparación',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  INVOICED: 'Facturado',
  CANCELLED: 'Cancelado',
};

export const ORDER_STATUS_DESCRIPTION: Record<OrderStatus, string> = {
  RECEIVED: 'Pedido recibido, pendiente de revisión',
  ON_HOLD: 'En espera de validación, datos o pago',
  IN_PREPARATION: 'En producción / grabado láser',
  SHIPPED: 'Enviado al cliente',
  DELIVERED: 'Recibido por el cliente',
  INVOICED: 'Facturado y cobrado',
  CANCELLED: 'Cancelado',
};

const STYLES: Record<OrderStatus, string> = {
  RECEIVED: 'bg-sky-100 text-sky-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  IN_PREPARATION: 'bg-amber-100 text-amber-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-brand-100 text-brand-800',
  INVOICED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const FALLBACK_STYLE = 'bg-ink-100 text-ink-700';

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status as OrderStatus;
  const label = ORDER_STATUS_LABEL[key] ?? status;
  const style = STYLES[key] ?? FALLBACK_STYLE;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', style, className)}>
      {label}
    </span>
  );
}
