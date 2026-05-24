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

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', STYLES[status], className)}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
