'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apagarPuntero } from '@/lib/laser-puntero';
import {
  buildDxfFilename,
  extractUniqueEngravings,
  generateDxfForLines,
  todayMadridYmd,
} from '@/lib/laser';

export interface EnviarState {
  ok?: boolean;
  error?: string;
  mensaje?: string;
  /** Este grabado ya se hizo: hay que confirmar antes de repetirlo. */
  repetir?: boolean;
}

/**
 * Manda un grabado a la cola de la grabadora.
 *
 * Genera el DXF igual que la descarga manual, lo archiva en el histórico y lo
 * deja encolado. El puente del taller lo recoge solo, lo prepara y espera al
 * pedal del operario: desde aquí NO se dispara nada.
 *
 * Si ese mismo grabado ya está esperando en la cola no se duplica, que si no
 * al pulsar dos veces se grabarían dos pulseras.
 */
export async function enviarAGrabadora(
  _prev: EnviarState,
  formData: FormData,
): Promise<EnviarState> {
  const session = await requireAdmin({ write: true });

  const orderId = String(formData.get('orderId') ?? '');
  const lineIdx = Number(formData.get('lineIndex') ?? -1);
  if (!orderId || !Number.isInteger(lineIdx) || lineIdx < 0) {
    return { error: 'Datos del grabado no válidos.' };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { error: 'Pedido no encontrado.' };

  const engravings = extractUniqueEngravings(order.items);
  const eng = engravings[lineIdx];
  if (!eng) return { error: 'Ese grabado ya no existe en el pedido.' };

  const filename = buildDxfFilename({
    orderNumber: order.number,
    pharmacyName: order.pharmacyName,
    lineIndex: lineIdx + 1,
    lineText: eng.lines[0] ?? '',
    color: eng.color,
    units: eng.totalUnits,
  });

  const yaEnCola = await prisma.laserFile.findFirst({
    where: {
      orderId: order.id,
      linesJoined: eng.lines.join(' · '),
      color: eng.color,
      queuedAt: { not: null },
      engravedAt: null,
    },
    select: { id: true },
  });
  if (yaEnCola) {
    return { ok: true, mensaje: 'Ese grabado ya estaba esperando en la grabadora.' };
  }

  // Repetir un grabado es normal —salió mal, o hacen falta más unidades— y
  // por eso no se bloquea. Pero tiene que ser a propósito: enviarlo otra vez
  // sin más gasta una pulsera, y una pulsera grabada no se puede desgrabar.
  if (String(formData.get('confirmado') ?? '') !== '1') {
    const yaGrabado = await prisma.laserFile.findFirst({
      where: {
        orderId: order.id,
        linesJoined: eng.lines.join(' · '),
        color: eng.color,
        engravedAt: { not: null },
      },
      orderBy: { engravedAt: 'desc' },
      select: { engravedAt: true },
    });
    if (yaGrabado?.engravedAt) {
      const cuando = yaGrabado.engravedAt.toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
      });
      return {
        repetir: true,
        mensaje: `Este grabado ya se hizo el ${cuando}. Si lo envías otra vez se grabará ` +
          'otra pulsera.',
      };
    }
  }

  let dxf: string;
  try {
    dxf = await generateDxfForLines(eng.lines);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'No se pudo generar el DXF.',
    };
  }
  const buffer = Buffer.from(dxf, 'utf-8');

  await prisma.laserFile.create({
    data: {
      orderId: order.id,
      orderNumber: order.number,
      pharmacyName: order.pharmacyName,
      cif: order.cif,
      filename,
      data: buffer,
      size: buffer.length,
      line1: eng.lines[0] ?? '',
      line2: eng.lines[1] ?? null,
      line3: eng.lines[2] ?? null,
      linesJoined: eng.lines.join(' · '),
      color: eng.color,
      totalUnits: eng.totalUnits,
      dateFolder: todayMadridYmd(),
      createdBy: session.email,
      queuedAt: new Date(),
      queuedBy: session.email,
    },
  });

  // Igual que en llaveros: el puntero se apaga al mandar el trabajo.
  await apagarPuntero();

  revalidatePath(`/admin/pedidos/${order.id}`);
  revalidatePath('/admin/laser/archivo');

  const uds = eng.totalUnits === 1 ? '1 pulsera' : `${eng.totalUnits} pulseras`;
  return {
    ok: true,
    mensaje: `Enviado a la grabadora (${uds}). Ve a la máquina y pisa el pedal.`,
  };
}
