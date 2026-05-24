'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { PrintArea } from '@/lib/settings';

interface Props {
  imageUrl: string;
  area: PrintArea;
  setArea: (a: PrintArea) => void;
  line1: string;
  line2: string;
  line3: string;
}

type DragMode =
  | { kind: 'none' }
  | { kind: 'move'; startX: number; startY: number; startArea: PrintArea }
  | { kind: 'resize'; corner: 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; startArea: PrintArea };

const MIN_W = 4; // % mínimo
const MIN_H = 2;

/**
 * Editor visual del área de impresión.
 * - La foto es el "lienzo".
 * - Hay un rectángulo sobre la placa que se puede ARRASTRAR (mover) o
 *   REDIMENSIONAR tirando de las 4 esquinas.
 * - Cualquier cambio actualiza `area` (en % respecto a la foto) en el padre.
 * - El texto se renderiza dentro del rectángulo con el mismo algoritmo
 *   que usa la web pública.
 */
export function InteractiveBraceletEditor({
  imageUrl,
  area,
  setArea,
  line1,
  line2,
  line3,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragMode>({ kind: 'none' });

  // Convertir delta de píxeles a delta porcentual respecto al tamaño del contenedor
  const pxToPct = useCallback(
    (dx: number, dy: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { dPctX: 0, dPctY: 0 };
      return {
        dPctX: (dx / rect.width) * 100,
        dPctY: (dy / rect.height) * 100,
      };
    },
    [],
  );

  // Mouse / touch unificados
  function startMove(clientX: number, clientY: number) {
    setDrag({ kind: 'move', startX: clientX, startY: clientY, startArea: area });
  }
  function startResize(corner: 'nw' | 'ne' | 'sw' | 'se', clientX: number, clientY: number) {
    setDrag({ kind: 'resize', corner, startX: clientX, startY: clientY, startArea: area });
  }

  useEffect(() => {
    if (drag.kind === 'none') return;

    function clamp(v: number, min: number, max: number) {
      return Math.max(min, Math.min(max, v));
    }

    function applyMove(clientX: number, clientY: number) {
      if (drag.kind === 'none') return;
      const { dPctX, dPctY } = pxToPct(clientX - drag.startX, clientY - drag.startY);

      if (drag.kind === 'move') {
        const newLeft = clamp(drag.startArea.leftPct + dPctX, 0, 100 - drag.startArea.widthPct);
        const newTop = clamp(drag.startArea.topPct + dPctY, 0, 100 - drag.startArea.heightPct);
        setArea({ ...drag.startArea, leftPct: newLeft, topPct: newTop });
        return;
      }

      if (drag.kind === 'resize') {
        let { leftPct, topPct, widthPct, heightPct } = drag.startArea;
        const right = leftPct + widthPct;
        const bottom = topPct + heightPct;

        switch (drag.corner) {
          case 'nw': {
            const newLeft = clamp(leftPct + dPctX, 0, right - MIN_W);
            const newTop = clamp(topPct + dPctY, 0, bottom - MIN_H);
            widthPct = right - newLeft;
            heightPct = bottom - newTop;
            leftPct = newLeft;
            topPct = newTop;
            break;
          }
          case 'ne': {
            const newRight = clamp(right + dPctX, leftPct + MIN_W, 100);
            const newTop = clamp(topPct + dPctY, 0, bottom - MIN_H);
            widthPct = newRight - leftPct;
            heightPct = bottom - newTop;
            topPct = newTop;
            break;
          }
          case 'sw': {
            const newLeft = clamp(leftPct + dPctX, 0, right - MIN_W);
            const newBottom = clamp(bottom + dPctY, topPct + MIN_H, 100);
            widthPct = right - newLeft;
            heightPct = newBottom - topPct;
            leftPct = newLeft;
            break;
          }
          case 'se': {
            const newRight = clamp(right + dPctX, leftPct + MIN_W, 100);
            const newBottom = clamp(bottom + dPctY, topPct + MIN_H, 100);
            widthPct = newRight - leftPct;
            heightPct = newBottom - topPct;
            break;
          }
        }
        setArea({ ...drag.startArea, leftPct, topPct, widthPct, heightPct });
      }
    }

    function onMouseMove(e: MouseEvent) {
      applyMove(e.clientX, e.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches[0]) applyMove(e.touches[0].clientX, e.touches[0].clientY);
    }
    function stop() {
      setDrag({ kind: 'none' });
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', stop);
    window.addEventListener('touchcancel', stop);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stop);
      window.removeEventListener('touchcancel', stop);
    };
  }, [drag, pxToPct, setArea]);

  // Texto a renderizar dentro del rectángulo (igual algoritmo que BraceletPhoto)
  const lines = [line1, line2, line3]
    .map((l) => (l ?? '').toUpperCase().trim())
    .filter((l) => l.length > 0);
  const lineCount = Math.max(1, Math.min(3, lines.length));
  const heightFontByCount: Record<number, number> = { 1: 62, 2: 42, 3: 28 };
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  const widthCq = Math.max(8, 170 / Math.max(maxLen, 4));
  const fontSize = `min(${heightFontByCount[lineCount]}cqh, ${widthCq.toFixed(2)}cqw)`;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-white select-none touch-none"
      style={{ aspectRatio: '4 / 3' }}
    >
      <img
        src={imageUrl}
        alt="Pulsera"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* Rectángulo arrastrable */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          startMove(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) startMove(t.clientX, t.clientY);
        }}
        className="absolute group"
        style={{
          left: `${area.leftPct}%`,
          top: `${area.topPct}%`,
          width: `${area.widthPct}%`,
          height: `${area.heightPct}%`,
          transform: `rotate(${area.rotationDeg}deg)`,
          transformOrigin: 'center center',
          cursor: drag.kind === 'move' ? 'grabbing' : 'grab',
          containerType: 'size',
        }}
      >
        {/* Borde de la caja */}
        <div className="absolute inset-0 border-2 border-dashed border-brand-600 bg-brand-500/10 rounded pointer-events-none" />

        {/* Texto centrado — mismo render que la web pública (mix-blend-mode multiply) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center overflow-hidden pointer-events-none"
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
                letterSpacing: '0.05em',
                textShadow: '0 0 0.4px rgba(0,0,0,0.25)',
                opacity: 0.95,
                WebkitFontSmoothing: 'antialiased',
              }}
            >
              {line}
            </span>
          ))}
        </div>

        {/* Asas de resize en 4 esquinas */}
        <CornerHandle
          corner="nw"
          onStart={(x, y) => startResize('nw', x, y)}
        />
        <CornerHandle
          corner="ne"
          onStart={(x, y) => startResize('ne', x, y)}
        />
        <CornerHandle
          corner="sw"
          onStart={(x, y) => startResize('sw', x, y)}
        />
        <CornerHandle
          corner="se"
          onStart={(x, y) => startResize('se', x, y)}
        />
      </div>
    </div>
  );
}

function CornerHandle({
  corner,
  onStart,
}: {
  corner: 'nw' | 'ne' | 'sw' | 'se';
  onStart: (clientX: number, clientY: number) => void;
}) {
  const posMap: Record<typeof corner, string> = {
    nw: '-top-2 -left-2 cursor-nwse-resize',
    ne: '-top-2 -right-2 cursor-nesw-resize',
    sw: '-bottom-2 -left-2 cursor-nesw-resize',
    se: '-bottom-2 -right-2 cursor-nwse-resize',
  };
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onStart(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        const t = e.touches[0];
        if (t) onStart(t.clientX, t.clientY);
      }}
      className={`absolute h-4 w-4 rounded-full bg-white border-2 border-brand-600 shadow ${posMap[corner]}`}
    />
  );
}
