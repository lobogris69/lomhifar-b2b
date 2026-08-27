/** Comprueba la nota de talonario y el reconocimiento de pedidos de mostrador. */
import { notaDeTalonario, esPedidoDeMostrador, CIF_MOSTRADOR } from '../src/lib/mostrador';

const casos: Array<[string, string, string]> = [
  ['A-1043', 'Urgente', 'Talonario nº A-1043\nUrgente'],
  ['A-1043', '', 'Talonario nº A-1043'],
  ['', 'Sin número', 'Pedido de talonario\nSin número'],
  ['', '', 'Pedido de talonario'],
  ['  77  ', '  nota  ', 'Talonario nº 77\nnota'],
];
let fallos = 0;
for (const [ref, nota, esperado] of casos) {
  const r = notaDeTalonario(ref, nota);
  const ok = r === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK ' : 'MAL'}  ${JSON.stringify(r)}`);
}
console.log(`\nes de mostrador: '${CIF_MOSTRADOR}' -> ${esPedidoDeMostrador(CIF_MOSTRADOR)}`);
console.log(`                 'mostrador'   -> ${esPedidoDeMostrador('mostrador')}`);
console.log(`                 'B12345678'   -> ${esPedidoDeMostrador('B12345678')}`);
console.log(`                 null          -> ${esPedidoDeMostrador(null)}`);
console.log(fallos === 0 ? '\nTodos correctos' : `\n${fallos} fallo(s)`);
