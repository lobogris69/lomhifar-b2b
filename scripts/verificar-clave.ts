/** Comprueba la comparación de claves del puente. */
import { claveCoincide } from '../src/lib/laser-cola';

const buena = 'AbCd1234_clave-larga-de-ejemplo';
const casos: Array<[string, string, boolean]> = [
  [buena, buena, true],
  [buena + 'x', buena, false],
  [buena.slice(0, -1), buena, false],
  ['', buena, false],
  [buena, '', false],
  ['', '', false],
  [buena.toLowerCase(), buena, false],
];
let fallos = 0;
for (const [recibida, esperada, esperado] of casos) {
  const r = claveCoincide(recibida, esperada);
  const ok = r === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK ' : 'MAL'}  recibida=${JSON.stringify(recibida.slice(0, 12))} → ${r}`);
}
console.log(fallos === 0 ? '\nTodos correctos' : `\n${fallos} fallo(s)`);
