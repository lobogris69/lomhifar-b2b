import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

type Variant = 'info' | 'success' | 'warning' | 'danger';

const styles: Record<Variant, { wrap: string; icon: React.ElementType; iconColor: string }> = {
  info: {
    wrap: 'bg-sky-50 border-sky-200 text-sky-900',
    icon: Info,
    iconColor: 'text-sky-600',
  },
  success: {
    wrap: 'bg-brand-50 border-brand-200 text-brand-900',
    icon: CheckCircle2,
    iconColor: 'text-brand-700',
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  danger: {
    wrap: 'bg-red-50 border-red-200 text-red-900',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: Variant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const s = styles[variant];
  const Icon = s.icon;
  return (
    <div className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', s.wrap, className)}>
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', s.iconColor)} />
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        {children && <div className="text-sm leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
