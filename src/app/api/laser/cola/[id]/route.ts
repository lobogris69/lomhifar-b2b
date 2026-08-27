import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { marcarComoLlevado, rechazoDeAutenticacion } from '@/lib/laser-cola';

export const dynamic = 'force-dynamic';

/**
 * GET /api/laser/cola/[id]
 *
 * Descarga el DXF de un trabajo de la cola y lo marca como llevado, para que
 * no lo coja otra vez el siguiente sondeo. Si el puente no llega a grabarlo,
 * vuelve solo a la cola pasado un rato (ver laser-cola.ts).
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const rechazo = await rechazoDeAutenticacion(req);
  if (rechazo) {
    return NextResponse.json({ error: rechazo }, { status: 401 });
  }

  const file = await prisma.laserFile.findUnique({ where: { id: params.id } });
  if (!file) {
    return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
  }

  await marcarComoLlevado(file.id);

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': 'application/dxf; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
      'Content-Length': String(file.size),
      'Cache-Control': 'no-store',
    },
  });
}
