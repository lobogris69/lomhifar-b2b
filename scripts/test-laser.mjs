// Test visual del generador láser con las medidas REALES (24×10mm).
// Usa el mismo algoritmo capHeight que src/lib/laser.ts.
// Genera SVG + PNG de varios casos en scripts/laser-test-out/.
import opentype from 'opentype.js';
import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

const settings = {
  plateWidthMm: 24,
  plateHeightMm: 10,
  marginLeftMm: 0.5,
  marginRightMm: 0.5,
  marginTopMm: 0.5,
  marginBottomMm: 0.5,
  lineHeightFactor: 1.25,
  curveSteps: 24,
};

function getCapRatio(font) {
  const upm = font.unitsPerEm || 2048;
  const os2 = font.tables.os2;
  if (os2 && os2.sCapHeight > 0) return os2.sCapHeight / upm;
  try {
    const bb = font.charToGlyph('H').getBoundingBox();
    if (bb && bb.y2 > 0) return bb.y2 / upm;
  } catch {}
  return 0.71;
}

function layoutLines(lines, s, font) {
  const valid = lines.map((l) => l.trim()).filter((l) => l.length > 0);
  const usableWidth = s.plateWidthMm - s.marginLeftMm - s.marginRightMm;
  const usableHeight = s.plateHeightMm - s.marginTopMm - s.marginBottomMm;
  const N = valid.length;
  const capRatio = getCapRatio(font);
  const gapFactor = Math.max(0, s.lineHeightFactor - 1);
  const capByHeight = usableHeight / (N + (N - 1) * gapFactor);
  let fontSizeMm = capByHeight / capRatio;
  let maxAdvance = 0;
  for (const line of valid) {
    const adv = font.getAdvanceWidth(line, fontSizeMm);
    if (adv > maxAdvance) maxAdvance = adv;
  }
  if (maxAdvance > usableWidth && maxAdvance > 0) fontSizeMm *= usableWidth / maxAdvance;
  const capHeightMm = fontSizeMm * capRatio;
  const gapMm = capHeightMm * gapFactor;
  const centerYArea = s.marginTopMm + usableHeight / 2;
  const blockH = N * capHeightMm + (N - 1) * gapMm;
  const blockTopY = centerYArea - blockH / 2;
  const rendered = [];
  for (let i = 0; i < N; i++) {
    const text = valid[i];
    const lineTopY = blockTopY + i * (capHeightMm + gapMm);
    const baselineY = lineTopY + capHeightMm;
    const advance = font.getAdvanceWidth(text, fontSizeMm);
    const x = s.marginLeftMm + (usableWidth - advance) / 2;
    const p = font.getPath(text, x, baselineY, fontSizeMm);
    rendered.push({ text, path: p });
  }
  return { fontSizeMm, capHeightMm, lines: rendered, usableWidth, usableHeight };
}

function renderSvg(layout, s) {
  const PAD = 1.5;
  const scale = 40; // px por mm para PNG nítido
  const paths = layout.lines.map((l) => l.path.toSVG(3)).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-PAD} ${-PAD} ${s.plateWidthMm + PAD * 2} ${s.plateHeightMm + PAD * 2}" width="${(s.plateWidthMm + PAD * 2) * scale}">
  <rect x="0" y="0" width="${s.plateWidthMm}" height="${s.plateHeightMm}" rx="1.2" fill="#e6e6ea" stroke="#b0b0b8" stroke-width="0.12"/>
  <rect x="${s.marginLeftMm}" y="${s.marginTopMm}" width="${layout.usableWidth}" height="${layout.usableHeight}" fill="none" stroke="#d12686" stroke-width="0.08" stroke-dasharray="0.3 0.25"/>
  <line x1="0" y1="${s.plateHeightMm / 2}" x2="${s.plateWidthMm}" y2="${s.plateHeightMm / 2}" stroke="#8aa" stroke-width="0.04" stroke-dasharray="0.4 0.4"/>
  <g fill="#1a1a20" stroke="none">
  ${paths}
  </g>
</svg>`;
}

async function main() {
  const buf = await fs.readFile(path.join(ROOT, 'src', 'lib', 'fonts', 'Roboto-Bold.ttf'));
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  console.log(`capRatio Roboto Bold = ${getCapRatio(font).toFixed(4)}`);

  const cases = [
    { name: '1-corto', lines: ['DIABETES'] },
    { name: '1-medio', lines: ['ALZHEIMER'] },
    { name: '1-largo', lines: ['ANTICOAGULADO'] },
    { name: '2-lineas', lines: ['DIABETES TIPO 1', 'TFNO 666123456'] },
    { name: '2-cortas', lines: ['EPILEPSIA', 'ICE 666123'] },
  ];

  const outDir = path.join(ROOT, 'scripts', 'laser-test-out');
  await fs.mkdir(outDir, { recursive: true });

  for (const tc of cases) {
    const layout = layoutLines(tc.lines, settings, font);
    const svg = renderSvg(layout, settings);
    await fs.writeFile(path.join(outDir, `${tc.name}.svg`), svg);
    await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, `${tc.name}.png`));
    console.log(`✓ ${tc.name.padEnd(10)} cap=${layout.capHeightMm.toFixed(2)}mm font=${layout.fontSizeMm.toFixed(2)}mm`);
  }
  console.log(`\n→ ${outDir}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
