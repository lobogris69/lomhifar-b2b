'use client';

import type { PrintArea } from '@/lib/settings';

interface Props {
  imageUrl: string;
  area: PrintArea;
  line1: string;
  line2: string;
  /** Si true, muestra un borde punteado sobre el área (modo edición admin) */
  showArea?: boolean;
  /** Texto alternativo de la imagen */
  alt?: string;
  className?: string;
}

/**
 * Renderiza una FOTO REAL de la pulsera (subida desde el admin) y
 * superpone el texto del grabado sobre la placa, según el área de impresión
 * configurada en `area` (porcentajes relativos a la imagen).
 *
 * El cliente del configurador ve cómo quedará SU pulsera sobre la foto real,
 * no sobre un dibujo SVG.
 */
export function BraceletPhoto({
  imageUrl,
  area,
  line1,
  line2,
  showArea = false,
  alt = 'Pulsera Lomhifar',
  className = '',
}: Props) {
  const l1 = (line1 || '').toUpperCase();
  const l2 = (line2 || '').toUpperCase();
  const hasL1 = l1.trim().length > 0;
  const hasL2 = l2.trim().length > 0;

  // Tamaño de fuente auto-ajustado al ancho del área:
  // - El área es widthPct% del ancho de la imagen → en CSS lo expresamos con cqi (container query inline)
  //   para que escale con el tamaño real renderizado de la imagen.
  // - El número base se calibra empíricamente: ~30% del alto del área por línea cuando hay 2 líneas,
  //   ~55% cuando solo hay 1.
  const linesShown = hasL2 ? 2 : 1;
  // Tamaño relativo al alto del overlay: cqh = % del container query block
  const fontSize = linesShown === 2 ? '30cqh' : '52cqh';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-white select-none ${className}`}
      style={{ aspectRatio: '4 / 3' }}
    >
      {/* Foto base */}
      <img
        src={imageUrl}
        alt={alt}
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Overlay con el texto grabado, posicionado y rotado según el área */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${area.leftPct}%`,
          top: `${area.topPct}%`,
          width: `${area.widthPct}%`,
          height: `${area.heightPct}%`,
          transform: `rotate(${area.rotationDeg}deg)`,
          transformOrigin: 'center center',
          // habilita unidades cqh/cqi dentro del overlay
          containerType: 'size',
        }}
      >
        {showArea && (
          <div className="absolute inset-0 border-2 border-dashed border-brand-500/80 rounded" />
        )}

        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center font-bold tracking-wider leading-[1.05] whitespace-nowrap overflow-hidden"
          style={{
            color: area.textColor,
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            fontSize,
            textShadow: '0 0 1px rgba(0,0,0,0.15)',
          }}
        >
          {hasL1 ? <span className="block px-1">{l1}</span> : null}
          {hasL2 ? <span className="block px-1">{l2}</span> : null}
        </div>
      </div>
    </div>
  );
}
