/**
 * Verificación del generador de DXF real de la app.
 *
 * Llama a generateDxfForLines con settings explícitos (no toca la base de
 * datos) y escribe el fichero, para comprobar que el DXF que produce la app
 * lo acepta un lector estándar (ezdxf) y por tanto MeerK40t.
 *
 * Uso:  npx tsx scripts/verificar-dxf.ts
 */
import { writeFileSync } from 'node:fs';
import { generateDxfForLines, type LaserSettings } from '../src/lib/laser';

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

const lineas = ['DIABETES TIPO 1', 'TFNO 666 123 456'];
const salida = 'C:/CLAUDE/laser/desde_app.dxf';

async function main() {
  const dxf = await generateDxfForLines(lineas, settings);
  writeFileSync(salida, dxf, 'utf8');

  const entidades = (dxf.match(/LWPOLYLINE/g) ?? []).length;
  console.log(`lineas   : ${JSON.stringify(lineas)}`);
  console.log(`entidades: ${entidades} LWPOLYLINE`);
  console.log(`acadver  : ${dxf.includes('$ACADVER') ? 'si' : 'NO'}`);
  console.log(`subclases: ${dxf.includes('AcDbPolyline') ? 'si' : 'NO'}`);
  console.log(`escrito  : ${salida} (${dxf.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
