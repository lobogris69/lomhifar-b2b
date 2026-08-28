import { randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from './prisma';
import { getSetting, setSetting, SETTING_KEYS } from './settings';

/**
 * Cola de la grabadora.
 *
 * El puente que controla el láser corre en el PC del taller y pregunta cada
 * pocos segundos si hay algo que grabar. Aquí está todo lo que necesita:
 * autenticarse, ver la cola, y avisar de que ha terminado.
 *
 * Flujo de un grabado:
 *
 *   [admin pulsa «Enviar a la grabadora»]  →  queuedAt
 *   [el puente se lo lleva]                →  takenAt     (evita duplicados)
 *   [el puente confirma que está grabado]  →  engravedAt
 *
 * Un DXF descargado a mano nunca pasa por aquí: se queda con las tres fechas
 * a null y aparece en el histórico como siempre.
 */

/** Cuánto puede estar un trabajo «en manos del puente» antes de volver a la cola. */
const MINUTOS_HASTA_REINTENTAR = 30;

// ============================================================
// Clave de acceso
// ============================================================

/**
 * Comparación en tiempo constante: comparar claves con === filtra información
 * por el tiempo que tarda en fallar.
 */
export function claveCoincide(recibida: string, esperada: string): boolean {
  if (!esperada || !recibida) return false;
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function generarClaveDelPuente(): Promise<string> {
  const clave = randomBytes(32).toString('base64url');
  await setSetting(SETTING_KEYS.LASER_BRIDGE_TOKEN, clave);
  return clave;
}

export async function claveDelPuente(): Promise<string> {
  return (await getSetting(SETTING_KEYS.LASER_BRIDGE_TOKEN)) ?? '';
}

/**
 * Comprueba la cabecera `Authorization: Bearer …` de una petición del puente.
 * Devuelve null si es válida, o el motivo del rechazo.
 */
export async function rechazoDeAutenticacion(req: Request): Promise<string | null> {
  const esperada = await claveDelPuente();
  if (!esperada) {
    return 'La grabadora no tiene clave configurada. Genérala en /admin/laser.';
  }
  const cabecera = req.headers.get('authorization') ?? '';
  const recibida = cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() : '';
  return claveCoincide(recibida, esperada) ? null : 'Clave no válida.';
}

// ============================================================
// La cola
// ============================================================

export interface TrabajoEnCola {
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
 * Trabajos pendientes de grabar, del más antiguo al más nuevo.
 *
 * Vuelven a la cola los que el puente se llevó hace rato y nunca confirmó:
 * si se cierra el programa a media faena, el trabajo no se queda colgado.
 */
export async function trabajosPendientes(limite = 20): Promise<TrabajoEnCola[]> {
  const limiteReintento = new Date(Date.now() - MINUTOS_HASTA_REINTENTAR * 60_000);
  const filas = await prisma.laserFile.findMany({
    where: {
      queuedAt: { not: null },
      engravedAt: null,
      OR: [{ takenAt: null }, { takenAt: { lt: limiteReintento } }],
    },
    orderBy: { queuedAt: 'asc' },
    take: limite,
    select: {
      id: true, filename: true, orderNumber: true, pharmacyName: true,
      color: true, totalUnits: true, line1: true, line2: true, line3: true,
      queuedAt: true,
    },
  });

  return filas.map((f) => ({
    id: f.id,
    filename: f.filename,
    orderNumber: f.orderNumber,
    pharmacyName: f.pharmacyName,
    color: f.color,
    units: f.totalUnits,
    lines: [f.line1, f.line2, f.line3].filter((l): l is string => Boolean(l && l.trim())),
    queuedAt: (f.queuedAt ?? new Date()).toISOString(),
  }));
}

/** El puente se lleva un trabajo. */
export async function marcarComoLlevado(id: string): Promise<void> {
  await prisma.laserFile.update({ where: { id }, data: { takenAt: new Date() } });
}

/** El puente confirma que está grabado. */
export async function marcarComoGrabado(id: string): Promise<void> {
  await prisma.laserFile.update({
    where: { id },
    data: { engravedAt: new Date(), intentos: 0 },
  });
}

/**
 * Cuántas veces se reintenta un trabajo antes de dejarlo en paz.
 *
 * Sin tope se montaba un tiovivo: el trabajo se arma, nadie pisa el pedal,
 * caduca a los diez minutos, vuelve a la cola, se arma otra vez… toda la
 * noche. Al llegar por la mañana llevaba tres vueltas y la máquina estaba
 * ocupada con un grabado que ya nadie quería.
 */
export const MAX_INTENTOS = 3;

/**
 * Devuelve un trabajo a la cola sin grabar (el puente falló o se canceló).
 *
 * Se limpia `takenAt` para que lo coja el siguiente intento sin esperar. Pero
 * a partir del tercer intento fallido SALE de la cola: si tres veces seguidas
 * nadie ha pisado el pedal, es que ese grabado no se quiere ahora, y hay que
 * volver a mandarlo a mano. Queda a la vista en el pedido, con su cuenta.
 */
export async function devolverALaCola(id: string): Promise<void> {
  const f = await prisma.laserFile.findUnique({
    where: { id },
    select: { intentos: true },
  });
  const intentos = (f?.intentos ?? 0) + 1;

  await prisma.laserFile.update({
    where: { id },
    data: intentos >= MAX_INTENTOS
      ? { takenAt: null, intentos, queuedAt: null, queuedBy: null }
      : { takenAt: null, intentos },
  });
}
