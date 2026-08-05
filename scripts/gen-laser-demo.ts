/**
 * Script de PRUEBA (no forma parte de la app): genera DXF + preview PNG
 * de ejemplo con la configuración láser real (24×10mm) usando la MISMA
 * lógica de producción (src/lib/laser.ts). Solo para enseñar el resultado
 * a Fernando; se puede borrar sin efecto.
 *
 *   npx tsx scripts/gen-laser-demo.ts <carpeta-salida>
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  generateDxfForLines,
  generateSvgPreview,
  type LaserSettings,
} from '../src/lib/laser';

// Configuración REAL leída del panel /admin/laser el 05-ago-2026
const settings: LaserSettings = {
  plateWidthMm: 24,
  plateHeightMm: 10,
  marginLeftMm: 0.5,
  marginRightMm: 0.5,
  marginTopMm: 0.5,
  marginBottomMm: 0.5,
  lineHeightFactor: 1.25,
  curveSteps: 24,
};

const examples: { name: string; lines: string[] }[] = [
  { name: '1linea', lines: ['ANA GARCÍA'] },
  { name: '2lineas', lines: ['ANA GARCÍA', 'ANTICOAGULADA'] },
  { name: '3lineas', lines: ['ANA GARCÍA', 'ANTICOAGULADA', 'TEL 600 123 456'] },
];

async function main() {
  const out = process.argv[2] || '.';
  await fs.mkdir(out, { recursive: true });

  for (const ex of examples) {
    const dxf = await generateDxfForLines(ex.lines, settings);
    const svg = await generateSvgPreview(ex.lines, settings);

    const dxfPath = path.join(out, `lomhifar-laser-${ex.name}.dxf`);
    const pngPath = path.join(out, `lomhifar-laser-${ex.name}.png`);
    await fs.writeFile(dxfPath, dxf, 'utf8');

    // Rasterizar el SVG a PNG grande (para verlo cómodo). Fondo blanco.
    const png = await sharp(Buffer.from(svg), { density: 600 })
      .resize({ width: 1200 })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer();
    await fs.writeFile(pngPath, png);

    console.log(`${ex.name}: DXF ${dxf.length}B, PNG ${png.length}B  →  ${dxfPath}`);
  }
  console.log('OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
