/**
 * Comprueba que la tinta del grabado queda centrada en altura dentro de la
 * placa, tanto con texto en mayúsculas como con minúsculas con rabo.
 */
import { generateDxfForLines, type LaserSettings } from '../src/lib/laser';

const s: LaserSettings = {
  plateWidthMm: 24,
  plateHeightMm: 10,
  marginLeftMm: 0.5,
  marginRightMm: 0.5,
  marginTopMm: 0.5,
  marginBottomMm: 0.5,
  lineHeightFactor: 1.9,
  curveSteps: 24,
};

async function medir(lineas: string[]) {
  const dxf = await generateDxfForLines(lineas, s);
  const t = dxf.split('\n').map((l) => l.trim());

  // Sólo las entidades: en la cabecera, $EXTMIN/$EXTMAX usan también el
  // código 20 y valen 0 y el alto de la placa, así que falsearían la medida.
  const desde = t.indexOf('ENTITIES');
  const ys: number[] = [];
  for (let i = desde; i < t.length - 1; i++) {
    if (t[i] === '20') {
      const v = Number(t[i + 1]);
      if (Number.isFinite(v)) ys.push(v);
    }
  }
  if (ys.length === 0) {
    console.log(`MAL  ${JSON.stringify(lineas)}: no he encontrado puntos`);
    return;
  }

  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const abajo = min;
  const arriba = s.plateHeightMm - max;
  const desvio = Math.abs(abajo - arriba);
  console.log(
    `${desvio < 0.05 ? 'OK ' : 'MAL'}  ${JSON.stringify(lineas)}\n` +
      `      alto de la tinta ${(max - min).toFixed(2)} mm · ` +
      `hueco abajo ${abajo.toFixed(2)} · hueco arriba ${arriba.toFixed(2)} ` +
      `→ desvío ${desvio.toFixed(3)} mm`,
  );
}

async function main() {
  await medir(['Fernando Ayllon']);
  await medir(['DIABETES TIPO 1']);
  await medir(['ALERGIA', 'Penicilina']);
  await medir(['pygj']);
}

main();
