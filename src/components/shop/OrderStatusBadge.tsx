import { OrderStatus } from '@/lib/enums';
import { cn } from '@/lib/utils';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: 'Recibido',
  IN_PREPARATION: 'En preparación',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STYLES: Record<OrderStatus, string> = {
  RECEIVED: 'bg-sky-100 text-sky-800',
  IN_PREPARATION: 'bg-amber-100 text-amber-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-brand-100 text-brand-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const FALLBACK_STYLE = 'bg-ink-100 text-ink-700';

/**
 * Acepta `string` para ser compatible con datos directos desde Prisma
 * (el campo status está modelado como String, no enum).
 */
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
