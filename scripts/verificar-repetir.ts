/** Comprueba la reescritura de la cantidad en nombres del histórico. */
import { conCantidadEnNombre } from '../src/lib/laser';

const base = '2026-08-27_Pedido-42_Farmacia_Lopez_Roja_L1_DIABETES.dxf';
const conCinco = '2026-08-27_Pedido-42_Farmacia_Lopez_Roja_x5_L1_DIABETES.dxf';
const sinLinea = '2026-08-27_suelto_Roja_DIABETES.dxf';

const casos: Array<[string, number, string]> = [
  [base, 1, base],
  [base, 3, '2026-08-27_Pedido-42_Farmacia_Lopez_Roja_x3_L1_DIABETES.dxf'],
  [conCinco, 1, base],
  [conCinco, 2, '2026-08-27_Pedido-42_Farmacia_Lopez_Roja_x2_L1_DIABETES.dxf'],
  [base, 999, '2026-08-27_Pedido-42_Farmacia_Lopez_Roja_x999_L1_DIABETES.dxf'],
  [base, 0, base],
  [sinLinea, 4, '2026-08-27_suelto_Roja_DIABETES_x4.dxf'],
];

let fallos = 0;
for (const [entrada, n, esperado] of casos) {
  const r = conCantidadEnNombre(entrada, n);
  const ok = r === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK ' : 'MAL'}  x${n}: ${r}`);
  if (!ok) console.log(`      esperaba: ${esperado}`);
}
console.log(fallos === 0 ? '\nTodos correctos' : `\n${fallos} fallo(s)`);
