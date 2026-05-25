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
  // Para una fuente bold sans (Helvetica Neue) con letter-spacing 0.04em,
  // cada carácter ocupa ≈ 0.65em. Necesitamos:
  //     fontSize_em × 0.65 × N  ≤  ancho_efectivo (88cqw tras padding lateral)
  //  →  fontSize_cqw  ≤  88 / (0.65 × N)  ≈  135 / N
  // Bajamos a 130/N para tener margen de seguridad y NO recortar nunca
  // los extremos del texto, ni en líneas de 17 caracteres.
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  const widthCq = Math.max(8, 130 / Math.max(maxLen, 4));

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

        {/*
          Texto del grabado láser.
          Para que NO parezca "pintado" sobre la placa sino realmente grabado:
          - mix-blend-mode: multiply hace que el color del texto se "multiplique"
            con la textura metálica de debajo, igual que un grabado físico que
            simplemente oscurece la superficie sin añadir pigmento opaco.
          - Color: gris frostado (#7d7d80 default) similar al símbolo médico
            ya estampado, NO negro. El láser sobre aluminio sin pintar produce
            ese tono mate gris/plateado.
          - Peso de fuente 600 (no 700/bold full): un grabado tiene grosor pero
            no es tan denso como una tipografía bold.
          - letter-spacing un pelín mayor (los grabados láser sobre placa
            pequeña suelen llevar separación para legibilidad).
          - text-shadow MUY sutil para suavizar bordes (el haz láser tiene un
            tamaño físico, no es matemáticamente perfecto).
        */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center overflow-hidden"
          style={{
            padding: '1% 3%',
            mixBlendMode: 'multiply',
          }}
        >
          {lines.map((line, i) => (
            <span
              key={i}
              className="block whitespace-nowrap"
              style={{
                color: area.textColor,
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                fontWeight: 600,
                fontSize,
                lineHeight: '1.02',
                letterSpacing: '0.04em',
                textShadow: '0 0 0.4px rgba(0,0,0,0.25)',
                opacity: 0.95,
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
