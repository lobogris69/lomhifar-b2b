import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Reparte el número de pedido sin que dos pedidos se lo lleven a la vez.
 *
 * El número se saca del máximo que hay en la tabla más uno. Entre esa
 * consulta y el alta hay un hueco: si dos farmacias confirman a la vez —o
 * una confirma mientras se mete un pedido de teléfono— las dos leen el mismo
 * máximo y piden el mismo número. Como la columna es única, la segunda alta
 * revienta y ese pedido se pierde con un error en pantalla.
 *
 * Aquí no se evita el choque: se asume y se reintenta. La base de datos es
 * la que decide quién se queda el número, que es la única forma de que no
 * haya dos pedidos con el mismo.
 */

const PRIMER_NUMERO = 1001;
const INTENTOS = 6;

export async function crearPedidoNumerado<T>(
  alta: (numero: number) => Promise<T>,
): Promise<T> {
  let ultimoError: unknown;

  for (let intento = 0; intento < INTENTOS; intento += 1) {
    const ultimo = await prisma.order.findFirst({
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    const numero = ultimo ? ultimo.number + 1 : PRIMER_NUMERO;

    try {
      return await alta(numero);
    } catch (e) {
      if (!esNumeroPillado(e)) throw e;
      ultimoError = e;
      // Otro pedido se llevó ese número mientras tanto. Se vuelve a mirar
      // cuál es el máximo ahora, que ya habrá subido.
    }
  }

  throw ultimoError instanceof Error
    ? ultimoError
    : new Error('No se ha podido asignar número al pedido.');
}

/** ¿El alta falló porque ese número ya estaba cogido? */
function esNumeroPillado(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (e.code !== 'P2002') return false;
  const campos = e.meta?.target;
  // Prisma nombra la restricción que ha saltado. Si no la dice, se da por
  // buena: el único unique que puede saltar aquí es el del número.
  if (Array.isArray(campos)) return campos.includes('number');
  if (typeof campos === 'string') return campos.includes('number');
  return true;
}
