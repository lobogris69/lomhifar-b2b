'use client';

import type { PrintArea } from '@/lib/settings';

interface Props {
  imageUrl: string;
  area: PrintArea;
  line1: string;
  line2: string;
  line3?: string;
  /** Si true, muestra un borde punteado sobre el área (modo edición admin) */
  showArea?: boolean;
  /** Texto alternativo de la imagen */
  alt?: string;
  className?: string;
}

/**
 * Renderiza una FOTO REAL de la pulsera (subida desde el admin) y
 * superpone el texto del grabado sobre la placa, respetando el área de
 * impresión configurada (porcentajes relativos a la imagen).
 *
 * El texto:
 *  - Siempre queda CENTRADO horizontal y verticalmente dentro del área.
 *  - Auto-ajusta el tamaño según el número de líneas usadas (1, 2 o 3)
 *    y la longitud de cada línea, sin salirse del rectángulo.
 *  - Usa container queries (cqh / cqw) para escalar con la imagen.
 */
export function BraceletPhoto({
  imageUrl,
  area,
  line1,
  line2,
  line3,
  showArea = false,
  alt = 'Pulsera Lomhifar',
  className = '',
}: Props) {
  const lines = [line1, line2, line3 ?? '']
    .map((l) => (l ?? '').toUpperCase().trim())
    .filter((l) => l.length > 0);

  const lineCount = Math.max(1, Math.min(3, lines.length));

  // Tamaño base de letra según número de líneas (en % del ALTO del área).
  // Se deja margen para que entre el padding y el tracking.
  const heightFontByCount: Record<number, number> = { 1: 62, 2: 42, 3: 28 };
  const heightCq = heightFontByCount[lineCount];

  // Tamaño máximo según ancho disponible (en % del ANCHO del área).
  // Asumimos ratio medio carácter ≈ 0.55em para fuente bold sans.
  // Por tanto, para encajar N chars: fontSize_px ≤ areaWidth / (N · 0.55)
  // En unidades cqw: fontSize_cqw = 100 / (N · 0.55) ≈ 180 / N
  // Como queremos margen lateral pequeño, restamos un poco.
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  const widthCq = Math.max(8, 170 / Math.max(maxLen, 4));

  // Usamos CSS min() para tomar el más pequeño de los dos límites.
  const fontSize = `min(${heightCq}cqh, ${widthCq.toFixed(2)}cqw)`;

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
          containerType: 'size',
        }}
      >
        {showArea && (
          <div className="absolute inset-0 border-2 border-dashed border-brand-500/80 rounded pointer-events-none" />
        )}

        {/* Texto: contenedor flex que centra todas las líneas como bloque */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center overflow-hidden"
          style={{ padding: '1% 3%' }}
        >
          {lines.map((line, i) => (
            <span
              key={i}
              className="block whitespace-nowrap font-bold"
              style={{
                color: area.textColor,
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                fontSize,
                lineHeight: '1.02',
                letterSpacing: '0.04em',
                // Efecto sutil de grabado láser: ligera sombra inferior clara
                // (simula el rebaje sobre el aluminio) + leve sombra interior oscura
                textShadow:
                  '0 1px 0 rgba(255,255,255,0.35), 0 -0.5px 0 rgba(0,0,0,0.4)',
                WebkitFontSmoothing: 'antialiased',
              }}
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
