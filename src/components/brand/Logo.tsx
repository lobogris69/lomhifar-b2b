import { cn } from '@/lib/utils';
import { BrandLockup, BrandMark } from './BrandMark';
import { getSiteImageMeta } from '@/lib/site-images';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

/**
 * Logo principal. Server component que consulta si el admin ha subido un logo
 * personalizado vía /admin/imagenes (slot "logo" o "logo-light"). En ese caso
 * renderiza la imagen subida; si no, usa el lockup SVG inline (BrandLockup).
 */
export async function Logo({
  className,
  variant = 'dark',
  showTagline = false,
  size = 'md',
  animated = false,
}: LogoProps) {
  const slot = variant === 'light' ? 'logo-light' : 'logo';
  const meta = await getSiteImageMeta(slot);

  if (meta.hasImage && meta.isCustom) {
    const heights: Record<NonNullable<LogoProps['size']>, string> = {
      sm: 'h-7',
      md: 'h-10',
      lg: 'h-12',
      xl: 'h-16',
    };
    const v = meta.updatedAt ? new Date(meta.updatedAt).getTime() : '';
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <img
          src={`/api/images/${slot}?v=${v}`}
          alt="Lomhifar"
          className={cn(heights[size], 'w-auto')}
        />
        {showTagline && (
          <span
            className={cn(
              'hidden sm:inline-block text-[10px] uppercase tracking-[0.28em] pl-3 border-l',
              variant === 'light'
                ? 'border-white/20 text-brand-200'
                : 'border-ink-200 text-brand-700',
            )}
          >
            Canal Farmacia
          </span>
        )}
      </div>
    );
  }

  // Fallback: lockup SVG inline (sin halo blanco, escalable)
  return (
    <BrandLockup
      className={className}
      variant={variant}
      showTagline={showTagline}
      size={size}
      animated={animated}
    />
  );
}

/**
 * Versión solo icono (cluster de puntos del logo) para favicons, avatares,
 * espacios reducidos.
 */
export function LogoMark({
  className,
  variant = 'dark',
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  return (
    <BrandMark
      className={cn('h-8 w-8', className)}
      secondary={variant === 'light' ? 'rgba(255,255,255,0.85)' : '#c2c2c7'}
    />
  );
}
