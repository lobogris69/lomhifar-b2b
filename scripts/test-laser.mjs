// Test rápido del generador láser sin necesidad de la BD.
// Simula settings por defecto y genera SVG + DXF para inspección visual.
import opentype from 'opentype.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

// Copia inline de las funciones de src/lib/laser.ts (sin depender de settings)
const settings = {
  plateWidthMm: 40,
  plateHeightMm: 10,
  marginLeftMm: 1.5,
  marginRightMm: 1.5,
  marginTopMm: 0.7,
  marginBottomMm: 0.7,
  lineHeightFactor: 1.05,
  curveSteps: 24,
};

async function main() {
  const buffer = await fs.readFile(path.join(ROOT, 'src', 'lib', 'fonts', 'Roboto-Bold.ttf'));
  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

  const testCases = [
    { name: '1-linea', lines: ['DIABETES TIPO 1'] },
    { name: '2-lineas', lines: ['DIABETES TIPO 1', 'TFNO 666 123 456'] },
    { name: '3-lineas', lines: ['ALZHEIMER', 'TFNO 666 123 456', 'ICE MARIA'] },
    { name: 'largo', lines: ['ANTICOAGULANTE SINTROM 24H'] },
  ];

  const outDir = path.join(ROOT, 'scripts', 'laser-test-out');
  await fs.mkdir(outDir, { recursive: true });

  for (const tc of testCases) {
    const layout = layoutLines(tc.lines, settings, font);
    // SVG
    const svg = renderSvg(layout, settings);
    await fs.writeFile(path.join(outDir, `${tc.name}.svg`), svg);
    // DXF
    const dxf = renderDxf(layout, settings);
    await fs.writeFile(path.join(outDir, `${tc.name}.dxf`), dxf);
    console.log(`✓ ${tc.name}: fontSize ${layout.fontSizeMm.toFixed(2)}mm, ${layout.lines.length} línea(s)`);
  }
  console.log(`\n→ Archivos en: ${outDir}`);
}

function layoutLines(lines, s, font) {
  const valid = lines.map((l) => l.trim()).filter((l) => l.length > 0);
  const usableWidth = s.plateWidthMm - s.marginLeftMm - s.marginRightMm;
  const usableHeight = s.plateHeightMm - s.marginTopMm - s.marginBottomMm;
  const N = valid.length;
  let fontSizeMm = usableHeight / (N * s.lineHeightFactor);
  let maxAdv = 0;
  for (const line of valid) {
    const adv = font.getAdvanceWidth(line, fontSizeMm);
    if (adv > maxAdv) maxAdv = adv;
  }
  if (maxAdv > usableWidth) fontSizeMm *= usableWidth / maxAdv;
  const totalTextHeight = N * fontSizeMm * s.lineHeightFactor;
  const areaTopY = s.marginTopMm;
  const blockTopY = areaTopY + (usableHeight - totalTextHeight) / 2;
  const firstBaselineY = blockTopY + fontSizeMm * 0.78;
  const rendered = [];
  for (let i = 0; i < N; i++) {
    const text = valid[i];
    const baselineY = firstBaselineY + i * fontSizeMm * s.lineHeightFactor;
    const advance = font.getAdvanceWidth(text, fontSizeMm);
    const x = s.marginLeftMm + (usableWidth - advance) / 2;
    const p = font.getPath(text, x, baselineY, fontSizeMm);
    rendered.push({ text, path: p });
  }
  return { fontSizeMm, lines: rendered, usableWidth, usableHeight };
}

function renderSvg(layout, s) {
  const PAD = 2;
  const paths = layout.lines.map((l) => l.path.toSVG(3)).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-PAD} ${-PAD} ${s.plateWidthMm + PAD * 2} ${s.plateHeightMm + PAD * 2}" width="800">
  <rect x="0" y="0" width="${s.plateWidthMm}" height="${s.plateHeightMm}" fill="#eaeaef" stroke="#c4c4cc" stroke-width="0.1"/>
  <rect x="${s.marginLeftMm}" y="${s.marginTopMm}" width="${layout.usableWidth}" height="${layout.usableHeight}" fill="none" stroke="#d12686" stroke-width="0.1" stroke-dasharray="0.4 0.3"/>
  <g fill="#1a1a20" stroke="none">
  ${paths}
  </g>
</svg>`;
}

function renderDxf(layout, s) {
  const entities = [];
  for (const line of layout.lines) {
    for (const pl of pathToPolylines(line.path.commands, s.plateHeightMm, s.curveSteps)) {
      entities.push(polylineToDxf(pl));
    }
  }
  return [
    '0', 'SECTION', '2', 'HEADER',
    '9', '$INSUNITS', '70', '4',
    '9', '$EXTMIN', '10', '0.0', '20', '0.0', '30', '0.0',
    '9', '$EXTMAX', '10', String(s.plateWidthMm), '20', String(s.plateHeightMm), '30', '0.0',
    '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES',
    entities.join('\n'),
    '0', 'ENDSEC', '0', 'EOF',
  ].join('\n');
}

function pathToPolylines(cmds, plateHeight, steps) {
  const polys = []; let cur = []; let lx = 0, ly = 0;
  const inv = (y) => plateHeight - y;
  const push = (x, y) => cur.push({ x, y: inv(y) });
  for (const c of cmds) {
    if (c.type === 'M') { if (cur.length > 1) polys.push(cur); cur = []; push(c.x, c.y); lx = c.x; ly = c.y; }
    else if (c.type === 'L') { push(c.x, c.y); lx = c.x; ly = c.y; }
    else if (c.type === 'Q') {
      for (let i = 1; i <= steps; i++) { const t = i/steps, mt = 1-t; push(mt*mt*lx + 2*mt*t*c.x1 + t*t*c.x, mt*mt*ly + 2*mt*t*c.y1 + t*t*c.y); }
      lx = c.x; ly = c.y;
    } else if (c.type === 'C') {
      for (let i = 1; i <= steps; i++) { const t = i/steps, mt = 1-t; push(mt*mt*mt*lx + 3*mt*mt*t*c.x1 + 3*mt*t*t*c.x2 + t*t*t*c.x, mt*mt*mt*ly + 3*mt*mt*t*c.y1 + 3*mt*t*t*c.y2 + t*t*t*c.y); }
      lx = c.x; ly = c.y;
    } else if (c.type === 'Z') {
      if (cur.length > 1) { const f = cur[0], l = cur[cur.length-1]; if (Math.abs(f.x-l.x) > 1e-4 || Math.abs(f.y-l.y) > 1e-4) cur.push({x:f.x, y:f.y}); polys.push(cur); }
      cur = [];
    }
  }
  if (cur.length > 1) polys.push(cur);
  return polys;
}

function polylineToDxf(pts) {
  const parts = ['0','LWPOLYLINE','8','0','90',String(pts.length),'70','1'];
  for (const p of pts) { parts.push('10', p.x.toFixed(4), '20', p.y.toFixed(4)); }
  return parts.join('\n');
}

main().catch(e => { console.error(e); process.exit(1); });
