import { prisma } from './prisma';

/**
 * Pedidos que llegan en papel (talonario, teléfono, visita) de farmacias que
 * NO son clientas dadas de alta.
 *
 * En vez de crear una ficha de cliente por cada una —con su CIF, su email y
 * su acceso a la tienda, que no existen— todos cuelgan de un único cliente
 * genérico "Mostrador". El nombre real de la farmacia se guarda en el propio
 * pedido, que ya lleva copia de los datos (`pharmacyName`, `cif`, …), así que
 * no se pierde de quién era.
 *
 * Consecuencias buscadas:
 *   - el stock se descuenta igual y la venta cuenta en el panel de negocio,
 *   - no se ensucia la lista de clientas con farmacias que no lo son,
 *   - si una de ellas se hace clienta más adelante, se le da de alta entonces
 *     y sus pedidos antiguos siguen ahí, a nombre suyo.
 */

export const CIF_MOSTRADOR = 'MOSTRADOR';
export const NOMBRE_MOSTRADOR = 'VARIOS · Mostrador';

/**
 * Devuelve el cliente genérico, creándolo la primera vez.
 *
 * Va marcado como inactivo a propósito: no debe aparecer como una farmacia
 * clienta ni tener acceso a la tienda. Los pedidos manuales sí lo admiten.
 */
export async function asegurarClienteMostrador() {
  const existente = await prisma.customer.findUnique({
    where: { cif: CIF_MOSTRADOR },
  });
  if (existente) return existente;

  return prisma.customer.create({
    data: {
      cif: CIF_MOSTRADOR,
      pharmacyName: NOMBRE_MOSTRADOR,
      email: '',
      source: 'MANUAL',
      active: false,
      notes:
        'Cliente genérico para pedidos en papel de farmacias no registradas. ' +
        'El nombre real de cada farmacia va en su pedido. No borrar.',
    },
  });
}

/** ¿Este pedido vino por talonario/mostrador? */
export function esPedidoDeMostrador(cif: string | null | undefined): boolean {
  return (cif ?? '').toUpperCase() === CIF_MOSTRADOR;
}

/**
 * Texto que se antepone a las notas del pedido para dejar constancia del
 * talonario. Se guarda en `adminNotes` porque es información de gestión
 * interna, no del cliente.
 */
export function notaDeTalonario(referencia: string, nota: string): string {
  const ref = referencia.trim();
  const cabecera = ref ? `Talonario nº ${ref}` : 'Pedido de talonario';
  const resto = nota.trim();
  return resto ? `${cabecera}\n${resto}` : cabecera;
}
