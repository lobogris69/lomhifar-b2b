/**
 * Canales por los que puede llegar un pedido manual.
 *
 * Viven en su propio módulo, y NO en actions.ts, porque un fichero marcado
 * con 'use server' sólo puede exportar funciones asíncronas. Exportar de ahí
 * una constante rompe la página en tiempo de ejecución con:
 *
 *   Error: A "use server" file can only export async functions, found object.
 *
 * y el fallo no aparece al compilar: salta al cargarse el módulo del servidor,
 * o sea al guardar el pedido, con la pantalla de error genérica de Next.
 */

export const CHANNEL_VALUES = [
  'PHONE',
  'EMAIL',
  'WHATSAPP',
  'VISIT',
  'NOTE',
  'OTHER',
] as const;

export type Channel = (typeof CHANNEL_VALUES)[number];

export const CHANNEL_LABEL: Record<Channel, string> = {
  PHONE: 'Teléfono',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  VISIT: 'Visita comercial',
  NOTE: 'Nota escrita',
  OTHER: 'Otro',
};
