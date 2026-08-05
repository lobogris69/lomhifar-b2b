import * as opentype from 'opentype.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getSettings, SETTING_KEYS } from './settings';

/**
 * Generador de archivos DXF para EZCAD (láser de fibra JCZ).
 *
 * Flujo:
 *   1. Se lee la configuración del área imprimible (mm) desde admin.
 *   2. Se leen las líneas del pedido (1, 2 o 3 líneas grabadas).
 *   3. Con opentype.js se obtiene el trazado vectorial de cada glifo
 *      (Inter Bold, misma fuente que la web). Así el DXF NO depende de
 *      qué fuentes tenga instaladas EZCAD — el vector va incrustado.
 *   4. Se centra el bloque de texto dentro del área útil.
 *   5. Se convierten los path commands (M/L/C/Q/Z) a LWPOLYLINE del
 *      DXF, discretizando las curvas Bézier al nº de pasos configurado.
 *   6. Origen (0,0) queda en la ESQUINA INFERIOR IZQUIERDA de la placa,
 *      convención estándar en EZCAD/JCZ.
 */

// ============================================================
// Configuración
// ============================================================

export interface LaserSettings {
  plateWidthMm: number;
  plateHeightMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  lineHeightFactor: number;
  curveSteps: number;
}

export async function getLaserSettings(): Promise<LaserSettings> {
  const s = await getSettings();
  return {
    plateWidthMm: numOr(s[SETTING_KEYS.LASER_PLATE_WIDTH_MM], 40),
    plateHeightMm: numOr(s[SETTING_KEYS.LASER_PLATE_HEIGHT_MM], 10),
    marginLeftMm: numOr(s[SETTING_KEYS.LASER_MARGIN_LEFT_MM], 1.5),
    marginRightMm: numOr(s[SETTING_KEYS.LASER_MARGIN_RIGHT_MM], 1.5),
    marginTopMm: numOr(s[SETTING_KEYS.LASER_MARGIN_TOP_MM], 0.7),
    marginBottomMm: numOr(s[SETTING_KEYS.LASER_MARGIN_BOTTOM_MM], 0.7),
    lineHeightFactor: numOr(s[SETTING_KEYS.LASER_LINE_HEIGHT_FACTOR], 1.05),
    curveSteps: Math.max(6, Math.min(64, Math.floor(numOr(s[SETTING_KEYS.LASER_CURVE_STEPS], 24)))),
  };
}

function numOr(v: string | undefined, d: number): number {
  if (!v) return d;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : d;
}

// ============================================================
// Fuente
// ============================================================

let cachedFont: opentype.Font | null = null;

async function loadFont(): Promise<opentype.Font> {
  if (cachedFont) return cachedFont;
  // Roboto Bold: fuente sans-serif universal, compatible al 100% con
  // opentype.js (a diferencia de Inter que usa lookupType 6 substFormat 2
  // no soportado por la lib). Visualmente muy similar a Helvetica/Inter,
  // perfecta para grabado láser.
  const buffer = await fs.readFile(
    path.join(process.cwd(), 'src', 'lib', 'fonts', 'Roboto-Bold.ttf'),
  );
  // opentype.parse necesita un ArrayBuffer no un Buffer/Uint8Array.
  const arrayBuf = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  const font = opentype.parse(arrayBuf);
  cachedFont = font;
  return font;
}

// ============================================================
// Cálculo de layout
// ============================================================

interface RenderedLine {
  text: string;
  path: opentype.Path;
  x: number;
  y: number;
}

interface LayoutResult {
  fontSizeMm: number;
  capHeightMm: number;
  lines: RenderedLine[];
  usableWidth: number;
  usableHeight: number;
}

/**
 * Altura de las MAYÚSCULAS de la fuente en fracción del em (0-1).
 * El grabado suele ser texto en mayúsculas, así que centrar y escalar
 * por el capHeight (no por el em completo, que incluye ascendentes y
 * descendentes fantasma) es lo que da el MÁXIMO aprovechamiento visual
 * del área diminuta de la placa.
 */
function getCapRatio(font: opentype.Font): number {
  const unitsPerEm = font.unitsPerEm || 2048;
  // 1) OS/2 sCapHeight si existe (lo más fiable)
  const os2 = (font.tables as { os2?: { sCapHeight?: number } }).os2;
  if (os2?.sCapHeight && os2.sCapHeight > 0) {
    return os2.sCapHeight / unitsPerEm;
  }
  // 2) Fallback: bounding box del glifo 'H'
  try {
    const gH = font.charToGlyph('H');
    const bb = gH.getBoundingBox();
    if (bb && Number.isFinite(bb.y2) && bb.y2 > 0) {
      return bb.y2 / unitsPerEm;
    }
  } catch {
    /* ignore */
  }
  // 3) Último recurso: ratio típico de una sans
  return 0.71;
}

async function layoutLines(
  lines: string[],
  s: LaserSettings,
): Promise<LayoutResult> {
  const font = await loadFont();
  const valid = lines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (valid.length === 0) {
    throw new Error('No hay texto para grabar');
  }

  const usableWidth = s.plateWidthMm - s.marginLeftMm - s.marginRightMm;
  const usableHeight = s.plateHeightMm - s.marginTopMm - s.marginBottomMm;
  if (usableWidth <= 0 || usableHeight <= 0) {
    throw new Error('Los márgenes exceden el tamaño de la placa');
  }

  const N = valid.length;
  const capRatio = getCapRatio(font);

  // ── PASO 1: máxima altura de mayúsculas que cabe verticalmente ──
  //
  // El separador entre líneas se expresa como fracción del capHeight:
  //   gapFactor = lineHeightFactor - 1   (1.0 → sin gap; 1.25 → 25%)
  //
  // Altura total del bloque de N líneas de mayúsculas:
  //   blockH = N·cap + (N-1)·cap·gapFactor
  //          = cap · (N + (N-1)·gapFactor)
  // Igualando a usableHeight → capHeight máximo por ALTURA:
  const gapFactor = Math.max(0, s.lineHeightFactor - 1);
  const capByHeight = usableHeight / (N + (N - 1) * gapFactor);

  // fontSize que produce ese capHeight
  let fontSizeMm = capByHeight / capRatio;

  // ── PASO 2: limitar por ANCHO ──
  // El advance escala lineal con el fontSize, así que basta medir a
  // este fontSize y, si la línea más ancha excede el área, reducir
  // TODAS las líneas por el mismo factor (misma altura de letra).
  let maxAdvance = 0;
  for (const line of valid) {
    const adv = font.getAdvanceWidth(line, fontSizeMm);
    if (adv > maxAdvance) maxAdvance = adv;
  }
  if (maxAdvance > usableWidth && maxAdvance > 0) {
    fontSizeMm = fontSizeMm * (usableWidth / maxAdvance);
  }

  // capHeight real definitivo (puede haberse reducido por ancho)
  const capHeightMm = fontSizeMm * capRatio;
  const gapMm = capHeightMm * gapFactor;

  // ── PASO 3: centrar el bloque EXACTAMENTE en el centro del área ──
  //
  // Coordenadas opentype/SVG: Y crece hacia ABAJO. getPath(text,x,y,size)
  // dibuja con 'y' = baseline; las mayúsculas suben (Y menor) capHeightMm.
  //
  //   centerYArea = mitad vertical del área útil = mitad de la placa
  //                 (para 1 línea, esto es la "mitad de la pulsera" que
  //                  pediste, p.ej. 0,5 cm si la placa mide 1 cm de alto).
  const centerYArea = s.marginTopMm + usableHeight / 2;
  const blockH = N * capHeightMm + (N - 1) * gapMm;
  const blockTopY = centerYArea - blockH / 2; // top del bloque (Y menor)

  const rendered: RenderedLine[] = [];
  for (let i = 0; i < N; i++) {
    const text = valid[i];
    // Top de las mayúsculas de la línea i
    const lineTopY = blockTopY + i * (capHeightMm + gapMm);
    // La baseline queda capHeightMm por debajo (Y mayor)
    const baselineY = lineTopY + capHeightMm;
    // Centrado horizontal exacto
    const advance = font.getAdvanceWidth(text, fontSizeMm);
    const x = s.marginLeftMm + (usableWidth - advance) / 2;
    const path = font.getPath(text, x, baselineY, fontSizeMm);
    rendered.push({ text, path, x, y: baselineY });
  }

  return { fontSizeMm, capHeightMm, lines: rendered, usableWidth, usableHeight };
}

// ============================================================
// SVG (para preview visual del texto sobre la placa)
// ============================================================

export async function generateSvgPreview(
  lines: string[],
  override?: LaserSettings,
): Promise<string> {
  const s = override ?? (await getLaserSettings());
  const layout = await layoutLines(lines, s);

  // viewBox en mm reales. Padding visual de 2mm alrededor para ver
  // el contorno de la placa cómodamente en el navegador.
  const PAD = 2;
  const vbX = -PAD;
  const vbY = -PAD;
  const vbW = s.plateWidthMm + PAD * 2;
  const vbH = s.plateHeightMm + PAD * 2;

  // Path SVG combinado de todos los caracteres
  const paths = layout.lines.map((l) => l.path.toSVG(3)).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="100%" style="max-width:100%;height:auto;background:#f8f8fa;font-family:system-ui,sans-serif;">
  <!-- Contorno de la placa -->
  <rect x="0" y="0" width="${s.plateWidthMm}" height="${s.plateHeightMm}" fill="#eaeaef" stroke="#c4c4cc" stroke-width="0.1"/>
  <!-- Área útil (imprimible) -->
  <rect x="${s.marginLeftMm}" y="${s.marginTopMm}" width="${layout.usableWidth}" height="${layout.usableHeight}" fill="none" stroke="#d12686" stroke-width="0.1" stroke-dasharray="0.4 0.3"/>
  <!-- Trazado del texto (láser grabaría esto) -->
  <g fill="#1a1a20" stroke="none">
  ${paths}
  </g>
  <!-- Cotas informativas -->
  <text x="${s.plateWidthMm / 2}" y="${-0.6}" text-anchor="middle" font-size="0.9" fill="#54545f">${s.plateWidthMm}mm</text>
  <text x="${-0.6}" y="${s.plateHeightMm / 2}" text-anchor="middle" font-size="0.9" fill="#54545f" transform="rotate(-90 ${-0.6} ${s.plateHeightMm / 2})">${s.plateHeightMm}mm</text>
</svg>`;
}

// ============================================================
// DXF (formato final para EZCAD)
// ============================================================

/**
 * Convierte un path opentype (comandos M/L/C/Q/Z) en un array de
 * polilíneas cerradas (cada glifo o contorno = una polilínea).
 * Discretiza las curvas Bézier al nº de pasos configurado.
 *
 * Devuelve puntos en el sistema DXF final:
 *   - X sin cambios (mm desde borde izquierdo de la placa)
 *   - Y invertido (opentype crece hacia abajo, DXF/EZCAD hacia arriba).
 *     Para invertir usamos y_dxf = plateHeightMm - y_opentype.
 */
interface Point { x: number; y: number; }

function pathToPolylines(
  cmds: opentype.PathCommand[],
  plateHeightMm: number,
  curveSteps: number,
): Point[][] {
  const polylines: Point[][] = [];
  let current: Point[] = [];
  let lastX = 0;
  let lastY = 0;

  const invY = (y: number) => plateHeightMm - y;
  const push = (x: number, y: number) => {
    current.push({ x, y: invY(y) });
  };

  for (const cmd of cmds) {
    switch (cmd.type) {
      case 'M':
        // Nuevo subpath — cerrar el anterior si tenía puntos
        if (current.length > 1) polylines.push(current);
        current = [];
        push(cmd.x, cmd.y);
        lastX = cmd.x;
        lastY = cmd.y;
        break;
      case 'L':
        push(cmd.x, cmd.y);
        lastX = cmd.x;
        lastY = cmd.y;
        break;
      case 'Q': {
        // Curva Bézier cuadrática de (lastX,lastY) a (x,y) con control (x1,y1)
        for (let i = 1; i <= curveSteps; i++) {
          const t = i / curveSteps;
          const mt = 1 - t;
          const bx = mt * mt * lastX + 2 * mt * t * cmd.x1 + t * t * cmd.x;
          const by = mt * mt * lastY + 2 * mt * t * cmd.y1 + t * t * cmd.y;
          push(bx, by);
        }
        lastX = cmd.x;
        lastY = cmd.y;
        break;
      }
      case 'C': {
        // Curva Bézier cúbica
        for (let i = 1; i <= curveSteps; i++) {
          const t = i / curveSteps;
          const mt = 1 - t;
          const bx = mt * mt * mt * lastX + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x;
          const by = mt * mt * mt * lastY + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y;
          push(bx, by);
        }
        lastX = cmd.x;
        lastY = cmd.y;
        break;
      }
      case 'Z':
        // Cerrar polilínea: si el primer y último punto no coinciden,
        // podemos añadir el primero al final para que quede cerrada.
        if (current.length > 1) {
          const first = current[0];
          const last = current[current.length - 1];
          if (Math.abs(first.x - last.x) > 1e-4 || Math.abs(first.y - last.y) > 1e-4) {
            current.push({ x: first.x, y: first.y });
          }
          polylines.push(current);
        }
        current = [];
        break;
    }
  }
  if (current.length > 1) polylines.push(current);
  return polylines;
}

function polylineToDxf(pts: Point[]): string {
  // LWPOLYLINE = polilínea 2D ligera. Cerrada (flag 70=1).
  // Formato: cabecera + N pares (10=X, 20=Y).
  const header = [
    '0', 'LWPOLYLINE',
    '8', '0',              // layer 0
    '90', String(pts.length),
    '70', '1',             // 1 = closed
  ];
  const pointLines: string[] = [];
  for (const p of pts) {
    pointLines.push('10', p.x.toFixed(4));
    pointLines.push('20', p.y.toFixed(4));
  }
  return [...header, ...pointLines].join('\n');
}

function wrapDxf(entitiesContent: string, s: LaserSettings): string {
  // Cabecera DXF R2000-compatible mínima que EZCAD acepta sin problemas.
  // Incluye HEADER con $INSUNITS=4 (milímetros) y $EXTMIN/$EXTMAX para
  // que EZCAD detecte el tamaño real del dibujo al importar.
  return [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$INSUNITS', '70', '4',           // 4 = mm
    '9', '$EXTMIN', '10', '0.0', '20', '0.0', '30', '0.0',
    '9', '$EXTMAX', '10', String(s.plateWidthMm), '20', String(s.plateHeightMm), '30', '0.0',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES',
    entitiesContent,
    '0', 'ENDSEC',
    '0', 'EOF',
  ].join('\n');
}

/**
 * API pública principal: genera el DXF para una serie de líneas de texto.
 * Devuelve un string con el contenido del fichero .dxf listo para escribir.
 */
export async function generateDxfForLines(
  lines: string[],
  override?: LaserSettings,
): Promise<string> {
  const s = override ?? (await getLaserSettings());
  const layout = await layoutLines(lines, s);

  const entities: string[] = [];
  for (const line of layout.lines) {
    const polylines = pathToPolylines(
      line.path.commands as opentype.PathCommand[],
      s.plateHeightMm,
      s.curveSteps,
    );
    for (const pl of polylines) {
      entities.push(polylineToDxf(pl));
    }
  }
  return wrapDxf(entities.join('\n'), s);
}

// ============================================================
// Utilidades de naming
// ============================================================

/**
 * Devuelve un slug seguro para nombre de fichero.
 * Ejemplos: "Farmacia Ayllón" → "FarmaciaAyllon"
 *          "DIABETES TIPO 1" → "DIABETES_TIPO_1"
 */
export function slugForFilename(s: string, maxLen = 40): string {
  return (s || 'sin-nombre')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLen)
    || 'sin-nombre';
}

/**
 * Fecha en formato YYYY-MM-DD en zona Europe/Madrid.
 */
export function todayMadridYmd(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now); // "2026-08-03"
}

export function buildDxfFilename(opts: {
  orderNumber: number | string;
  pharmacyName: string;
  lineIndex: number;
  lineText: string;
  date?: Date;
}): string {
  const ymd = todayMadridYmd(opts.date ?? new Date());
  const pharma = slugForFilename(opts.pharmacyName, 24);
  const preview = slugForFilename(opts.lineText, 20);
  return `${ymd}_Pedido-${opts.orderNumber}_${pharma}_L${opts.lineIndex}_${preview}.dxf`;
}

/**
 * Extrae los "textos únicos" de un pedido (deduplicados por línea 1+2+3
 * concatenadas). Útil para saber cuántos DXF distintos hay que grabar.
 */
export interface UniqueEngraving {
  key: string;              // hash-like para identificar
  lines: string[];          // ['DIABETES TIPO 1', 'TFNO 666 123 456']
  totalUnits: number;       // suma de quantity de todos los items con este texto
  color: string;            // 'BLACK' | 'RED'
  fromItems: string[];      // IDs de los OrderItem originales
}

export function extractUniqueEngravings(
  items: Array<{
    id: string;
    color: string;
    quantity: number;
    line1: string;
    line2?: string | null;
    line3?: string | null;
  }>,
): UniqueEngraving[] {
  const map = new Map<string, UniqueEngraving>();
  for (const it of items) {
    const lines = [it.line1, it.line2 ?? '', it.line3 ?? '']
      .map((l) => (l ?? '').trim())
      .filter((l) => l.length > 0);
    const key = `${it.color}::${lines.join('|')}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalUnits += it.quantity;
      existing.fromItems.push(it.id);
    } else {
      map.set(key, {
        key,
        lines,
        totalUnits: it.quantity,
        color: it.color,
        fromItems: [it.id],
      });
    }
  }
  return Array.from(map.values());
}
