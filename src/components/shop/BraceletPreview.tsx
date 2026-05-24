'use client';

import { cn } from '@/lib/utils';

interface Props {
  /** Color de la pulsera: "BLACK" | "RED" (string compatible con datos de Prisma) */
  color: string;
  line1: string;
  line2: string;
  className?: string;
  /**
   * Tamaño relativo. La pulsera real es 22 cm × 1 cm y la placa 4 cm × 1 cm,
   * proporción 22:1 que renderizamos manteniendo escala.
   */
  size?: 'sm' | 'md' | 'lg';
  showRuler?: boolean;
}

const SIZE_CLASS = {
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[680px]',
};

/**
 * Vista previa fiel del producto Lomhifar:
 * - Pulsera de silicona alargada (22 cm × 1 cm) con cierre de aluminio
 * - Placa central de aluminio (4 cm × 1 cm) con bisel
 * - Texto grabado a LÁSER en 2 líneas dentro de la placa
 *   → el grabado láser sobre aluminio produce un tono antracita/grisáceo,
 *     nunca negro puro. Usamos #4a4a52 (gris antracita oxidado).
 * - Símbolo médico (Star of Life) a la izquierda de la placa, grabado igual.
 */
const ENGRAVE_COLOR = '#4a4a52';        // antracita: laser sobre aluminio
const ENGRAVE_COLOR_DEEP = '#3d3d44';   // ligeramente más oscuro para el símbolo

export function BraceletPreview({
  color,
  line1,
  line2,
  className,
  size = 'md',
  showRuler = false,
}: Props) {
  const isBlack = color === 'BLACK';
  const strapBorder = isBlack ? '#000' : '#3a0509';

  // Densidad de orificios del strap (lado largo)
  const holes = Array.from({ length: 7 });

  return (
    <div className={cn('w-full', SIZE_CLASS[size], 'mx-auto', className)}>
      <div
        className="relative rounded-2xl bg-gradient-to-b from-ink-50 to-ink-100 px-4 py-8 sm:py-10"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <svg
          viewBox="0 0 660 90"
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          aria-label={`Pulsera ${isBlack ? 'negra' : 'roja'} con grabado láser sobre aluminio`}
        >
          <defs>
            <linearGradient id="strapGrad" x1="0" y1="0" x2="0" y2="1">
              {isBlack ? (
                <>
                  <stop offset="0%" stopColor="#2c2c34" />
                  <stop offset="45%" stopColor="#0a0a0e" />
                  <stop offset="100%" stopColor="#1f1f25" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#b81d2b" />
                  <stop offset="45%" stopColor="#560810" />
                  <stop offset="100%" stopColor="#8c121f" />
                </>
              )}
            </linearGradient>
            {/* Aluminio: ligeramente más mate y frío que el acero inoxidable */}
            <linearGradient id="aluGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ededef" />
              <stop offset="45%" stopColor="#c5c5cb" />
              <stop offset="100%" stopColor="#85858d" />
            </linearGradient>
            <linearGradient id="buckleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0e0e4" />
              <stop offset="100%" stopColor="#85858d" />
            </linearGradient>
            {/* Sutil "frosted" textura para el área grabada — simula el efecto láser */}
            <filter id="plateShadow" x="-10%" y="-50%" width="120%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Strap completo */}
          <rect
            x="10"
            y="30"
            width="640"
            height="30"
            rx="6"
            fill="url(#strapGrad)"
            stroke={strapBorder}
            strokeWidth="0.6"
          />

          {/* Orificios en el lado izquierdo */}
          {holes.map((_, i) => (
            <circle
              key={`h-${i}`}
              cx={28 + i * 14}
              cy={45}
              r={2.4}
              fill="#000"
              opacity={isBlack ? 0.85 : 0.55}
            />
          ))}

          {/* Hebilla / cierre derecho */}
          <rect
            x="612"
            y="26"
            width="32"
            height="38"
            rx="3"
            fill="url(#buckleGrad)"
            stroke="#666"
            strokeWidth="0.4"
          />
          <rect
            x="620"
            y="34"
            width="16"
            height="22"
            rx="1.5"
            fill={isBlack ? '#111' : '#400'}
            opacity="0.85"
          />

          {/* Patillas / fijación entre strap y placa */}
          <rect x="218" y="28" width="6" height="34" rx="1.5" fill="url(#aluGrad)" />
          <rect x="436" y="28" width="6" height="34" rx="1.5" fill="url(#aluGrad)" />

          {/* Placa de aluminio (4 cm × 1 cm proporcional) */}
          <g filter="url(#plateShadow)">
            <rect
              x="220"
              y="26"
              width="220"
              height="38"
              rx="4"
              fill="url(#aluGrad)"
              stroke="#7a7a82"
              strokeWidth="0.6"
            />
            {/* Bisel superior brillante */}
            <rect x="222" y="27" width="216" height="2" rx="1" fill="#ffffff" opacity="0.65" />
            {/* Bisel inferior oscuro */}
            <rect x="222" y="61" width="216" height="1.5" rx="0.75" fill="#5a5a62" opacity="0.5" />
          </g>

          {/* Symbol "Star of Life" — grabado láser, color antracita */}
          <g transform="translate(235, 45)">
            <g fill={ENGRAVE_COLOR_DEEP}>
              <rect x="-2" y="-12" width="4" height="24" rx="1.2" />
              <rect x="-2" y="-12" width="4" height="24" rx="1.2" transform="rotate(60)" />
              <rect x="-2" y="-12" width="4" height="24" rx="1.2" transform="rotate(120)" />
            </g>
            {/* Punto central plateado del bastón de Asclepio */}
            <circle cx="0" cy="0" r="2.2" fill="#cfcfd5" />
          </g>

          {/* TEXTO GRABADO — antracita (no negro), sin sombra de "tinta" */}
          <foreignObject x="252" y="28" width="180" height="34">
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: ENGRAVE_COLOR,
                lineHeight: 1.05,
                textAlign: 'center',
              }}
            >
              <div
                className="engrave-text"
                style={{
                  fontSize: line1.length > 10 ? 9 : 11,
                  letterSpacing: '0.06em',
                  // Efecto sutil de "frosted etch" en lugar de sombra de tinta
                  textShadow: '0 0.4px 0 rgba(255,255,255,0.45)',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {line1 || <span style={{ opacity: 0.3 }}>LÍNEA 1</span>}
              </div>
              <div
                className="engrave-text"
                style={{
                  fontSize: line2.length > 10 ? 8 : 9.5,
                  letterSpacing: '0.06em',
                  marginTop: 1,
                  textShadow: '0 0.4px 0 rgba(255,255,255,0.45)',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  opacity: line2 ? 1 : 0.3,
                  fontWeight: 600,
                }}
              >
                {line2 || 'LÍNEA 2 (OPCIONAL)'}
              </div>
            </div>
          </foreignObject>

          {showRuler && (
            <>
              <line x1="10" y1="78" x2="650" y2="78" stroke="#999" strokeWidth="0.6" />
              <line x1="10" y1="75" x2="10" y2="81" stroke="#999" strokeWidth="0.6" />
              <line x1="650" y1="75" x2="650" y2="81" stroke="#999" strokeWidth="0.6" />
              <text x="330" y="86" fontSize="6" fill="#666" textAnchor="middle">
                22 cm
              </text>
              <line x1="220" y1="20" x2="440" y2="20" stroke="#d12686" strokeWidth="0.8" />
              <text x="330" y="17" fontSize="6" fill="#d12686" textAnchor="middle" fontWeight="600">
                Placa 4 cm
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
        <span className="badge-muted">
          {isBlack ? 'Pulsera negra' : 'Pulsera roja'} · silicona médica
        </span>
        <span>Placa de aluminio 4 × 1 cm · grabado láser</span>
      </div>
    </div>
  );
}
