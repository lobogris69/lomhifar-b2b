import { cn } from '@/lib/utils';

/**
 * Marca Lomhifar reproducida como SVG inline.
 * Inspirada en el logo corporativo: cluster de puntos en parallelogramo
 * tilteado, con núcleo magenta degradado y dots exteriores en plata.
 * Al ser SVG escala perfecto, no tiene halo blanco y se puede animar/teñir.
 */
interface BrandMarkProps {
  className?: string;
  /** Color del núcleo. Por defecto el magenta corporativo. */
  primary?: string;
  /** Color de los dots de la corona/silueta exterior. */
  secondary?: string;
  /** Si true, los dots tienen leve animación de pulso. */
  animated?: boolean;
}

// Coordenadas calculadas a mano para reproducir la silueta del logo:
// parallelogramo inclinado en perspectiva, 7 filas de 7-8 dots.
// La "intensidad" (1 = plata fría, 2 = transición, 3 = magenta núcleo)
// se asigna por posición para que el centro brille y los bordes se difuminen.
//
// El "tilt" del logo se consigue desplazando cada fila +X y reduciendo el size
// progresivamente, dando sensación de perspectiva 3D.
const ROWS: { y: number; xs: { x: number; t: 1 | 2 | 3; r: number }[] }[] = [
  // y, [(x, tier, radius)]
  { y: 10,  xs: [[34,1,2.6],[44,1,2.7],[54,1,2.8],[64,1,2.8],[74,1,2.7]].map(([x,t,r])=>({x,t:t as 1|2|3,r})) },
  { y: 22,  xs: [[26,1,2.9],[37,2,3.1],[48,2,3.2],[59,2,3.2],[70,2,3.1],[81,1,2.9]].map(([x,t,r])=>({x,t:t as 1|2|3,r})) },
  { y: 35,  xs: [[20,1,3.0],[32,2,3.3],[44,3,3.5],[56,3,3.6],[68,3,3.5],[80,2,3.3],[92,1,3.0]].map(([x,t,r])=>({x,t:t as 1|2|3,r})) },
  { y: 49,  xs: [[16,1,3.1],[28,3,3.6],[41,3,3.8],[54,3,3.9],[67,3,3.8],[80,3,3.6],[93,1,3.1]].map(([x,t,r])=>({x,t:t as 1|2|3,r})) },
  { y: 63,  xs: [[14,1,3.0],[26,2,3.5],[39,3,3.7],[52,3,3.8],[65,3,3.7],[78,2,3.5],[91,1,3.0]].map(([x,t,r])=>({x,t:t as 1|2|3,r})) },
  { y: 76,  xs: [[14,1,2.8],[26,1,3.2],[39,2,3.4],[52,2,3.5],[65,2,3.4],[78,1,3.2]].map(([x,t,r])=>({x,t:t as 1|2|3,r})) },
  { y: 88,  xs: [[16,1,2.6],[28,1,2.9],[41,1,3.0],[54,1,3.0],[67,1,2.9]].map(([x,t,r])=>({x,t:t as 1|2|3,r})) },
];

export function BrandMark({
  className,
  primary = '#d12686',
  secondary = '#c2c2c7',
  animated = false,
}: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 108 100"
      className={cn('inline-block', className)}
      aria-hidden
    >
      <defs>
        <radialGradient id="bm-core" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={primary} stopOpacity="1" />
          <stop offset="60%" stopColor={primary} stopOpacity="0.95" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id="bm-shell" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={secondary} stopOpacity="0.95" />
          <stop offset="100%" stopColor={secondary} stopOpacity="0.55" />
        </radialGradient>
        {animated && (
          <style>{`
            @keyframes bm-pulse-core { 0%,100% { opacity: 0.95 } 50% { opacity: 1 } }
            @keyframes bm-pulse-edge { 0%,100% { opacity: 0.55 } 50% { opacity: 0.85 } }
            .bm-core { animation: bm-pulse-core 3.6s ease-in-out infinite; }
            .bm-edge { animation: bm-pulse-edge 4.2s ease-in-out infinite; }
          `}</style>
        )}
      </defs>
      <g>
        {ROWS.flatMap((row, ri) =>
          row.xs.map((d, ci) => {
            const fill =
              d.t === 3 ? 'url(#bm-core)' : d.t === 2 ? primary : 'url(#bm-shell)';
            const cls = d.t === 3 ? 'bm-core' : d.t === 1 ? 'bm-edge' : '';
            return (
              <circle
                key={`${ri}-${ci}`}
                cx={d.x}
                cy={row.y}
                r={d.r}
                fill={fill}
                className={animated ? cls : undefined}
                opacity={d.t === 1 ? 0.7 : 1}
              />
            );
          }),
        )}
      </g>
    </svg>
  );
}

/**
 * Wordmark "Lomhifar" tipográfico (sin imagen).
 * Usa la fuente sans del proyecto con tracking y peso ajustados.
 */
export function BrandWordmark({
  className,
  variant = 'dark',
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  return (
    <span
      className={cn(
        'font-display font-semibold tracking-tight leading-none select-none',
        variant === 'light' ? 'text-white' : 'text-ink-900',
        className,
      )}
      aria-label="Lomhifar"
    >
      Lomhifar
    </span>
  );
}

/**
 * Lockup completo: marca + wordmark + tagline opcional.
 * Sustituye el `<Logo>` antiguo cuando quieras integración pura sin PNG.
 */
export function BrandLockup({
  variant = 'dark',
  showTagline = false,
  className,
  size = 'md',
  animated = false,
}: {
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}) {
  const isLight = variant === 'light';
  const markSize = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
    xl: 'h-20 w-20',
  }[size];
  const wordSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  }[size];
  const taglineColor = isLight ? 'text-brand-200' : 'text-brand-700';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <BrandMark
        className={markSize}
        secondary={isLight ? 'rgba(255,255,255,0.85)' : '#c2c2c7'}
        animated={animated}
      />
      <div className="flex flex-col leading-none">
        <BrandWordmark className={wordSize} variant={variant} />
        {showTagline && (
          <span
            className={cn(
              'mt-1.5 text-[10px] uppercase tracking-[0.28em]',
              taglineColor,
            )}
          >
            Canal Farmacia
          </span>
        )}
      </div>
    </div>
  );
}
