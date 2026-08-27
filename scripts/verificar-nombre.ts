/**
 * Comprueba que buildDxfFilename mete la cantidad en el nombre y que el
 * formato es el que el puente de la grabadora sabe leer (`_xN_`).
 */
import { buildDxfFilename, extractUniqueEngravings } from '../src/lib/laser';

const casos = [
  { units: 1, desc: 'una unidad (no debe aparecer)' },
  { units: 2, desc: 'dos unidades' },
  { units: 12, desc: 'doce unidades' },
];

const patronDelPuente = /[_-]x([0-9]{1,3})[_-]/i;

for (const c of casos) {
  const n = buildDxfFilename({
    orderNumber: 42,
    pharmacyName: 'Farmacia López',
    lineIndex: 1,
    lineText: 'DIABETES TIPO 1',
    color: 'RED',
    units: c.units,
    date: new Date('2026-08-27T10:00:00Z'),
  });
  const m = n.match(patronDelPuente);
  const leido = m ? Number(m[1]) : 1;
  const ok = leido === c.units;
  console.log(`${ok ? 'OK ' : 'MAL'}  ${c.desc}: el puente leería ${leido}`);
  console.log(`      ${n}`);
}

// Y que totalUnits sale bien del pedido
const engravings = extractUniqueEngravings([
  { id: 'a', color: 'RED', quantity: 3, line1: 'ASMA' },
  { id: 'b', color: 'RED', quantity: 2, line1: 'ASMA' },
  { id: 'c', color: 'BLACK', quantity: 1, line1: 'ASMA' },
]);
console.log('\ngrabados únicos:', engravings.map((e) => `${e.color} x${e.totalUnits}`).join(', '));
