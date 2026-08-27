import { prisma } from './prisma';
import {
  esMaterial,
  MATERIALES,
  nombreDeFicheroLlavero,
} from './llaveros';

/**
 * Los llaveros en la cola de la grabadora.
 *
 * Comparten cola con las pulseras a propósito: el puente, el pedal y todo el
 * ciclo ya funcionan y no hay razón para montar otro. Lo único que hace falta
 * es distinguir de qué tabla sale cada trabajo, y para eso el id viaja con un
 * prefijo. Así `laser-cola.ts` —que es lo que mueve los pedidos de verdad— no
 * se toca.
 */

export const PREFIJO = 'llav_';

export function esLlavero(id: string): boolean {
  return id.startsWith(PREFIJO);
}

export function idReal(id: string): string {
  return id.startsWith(PREFIJO) ? id.slice(PREFIJO.length) : id;
}

/** Un trabajo que se llevó el puente y nunca confirmó vuelve a la cola. */
const MINUTOS_HASTA_REINTENTAR = 30;

export interface LlaveroEnCola {
  id: string;
  filename: string;
  orderNumber: number;
  pharmacyName: string;
  color: string;
  units: number;
  lines: string[];
  queuedAt: string;
}

/**
 * Llaveros pendientes, con la misma forma que un trabajo de pulsera para que
 * el puente no tenga que distinguirlos.
 *
 * `orderNumber` va a 0 y `pharmacyName` dice que es taller: no hay pedido ni
 * farmacia detrás, y el puente solo los usa para escribirlos en el registro.
 */
export async function llaverosPendientes(limite = 10): Promise<LlaveroEnCola[]> {
  const limiteReintento = new Date(Date.now() - MINUTOS_HASTA_REINTENTAR * 60_000);

  const filas = await prisma.keyringJob.findMany({
    where: {
      queuedAt: { not: null },
      engravedAt: null,
      // Por el tamaño y no por `dxf: { not: null }`: filtrar un campo binario
      // por «no nulo» dejaba la lista vacía aunque el trabajo estuviera
      // encolado y el DXF guardado. `size` es un número corriente y hace lo
      // mismo, porque se escriben a la vez.
      size: { gt: 0 },
      OR: [{ takenAt: null }, { takenAt: { lt: limiteReintento } }],
    },
    orderBy: { queuedAt: 'asc' },
    take: limite,
    select: {
      id: true, nombre: true, material: true, unidades: true,
      createdAt: true, queuedAt: true,
    },
  });

  return filas.map((f) => {
    const material = esMaterial(f.material) ? f.material : 'SILVER';
    return {
      id: PREFIJO + f.id,
      filename: nombreDeFicheroLlavero({
        nombre: f.nombre,
        material,
        unidades: f.unidades,
        fecha: f.createdAt,
      }),
      orderNumber: 0,
      pharmacyName: `Taller · llavero ${MATERIALES[material].etiqueta.toLowerCase()}`,
      color: material,
      units: f.unidades,
      lines: [f.nombre],
      queuedAt: (f.queuedAt ?? new Date()).toISOString(),
    };
  });
}

export async function llaveroLlevado(id: string): Promise<void> {
  await prisma.keyringJob.update({
    where: { id: idReal(id) },
    data: { takenAt: new Date() },
  });
}

export async function llaveroGrabado(id: string): Promise<void> {
  await prisma.keyringJob.update({
    where: { id: idReal(id) },
    data: { engravedAt: new Date() },
  });
}

export async function llaveroDevueltoALaCola(id: string): Promise<void> {
  await prisma.keyringJob.update({
    where: { id: idReal(id) },
    data: { takenAt: null },
  });
}

export async function dxfDelLlavero(id: string) {
  const t = await prisma.keyringJob.findUnique({
    where: { id: idReal(id) },
    select: {
      id: true, nombre: true, material: true, unidades: true,
      dxf: true, size: true, createdAt: true,
    },
  });
  if (!t || !t.dxf) return null;
  return {
    datos: t.dxf,
    size: t.size,
    filename: nombreDeFicheroLlavero({
      nombre: t.nombre,
      material: esMaterial(t.material) ? t.material : 'SILVER',
      unidades: t.unidades,
      fecha: t.createdAt,
    }),
  };
}
