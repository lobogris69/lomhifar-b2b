import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { conCantidadEnNombre } from '@/lib/laser';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/laser/file/[id]?units=N
 *
 * Devuelve el DXF archivado. Con `units` se descarga el MISMO dibujo pero
 * con la cantidad cambiada en el nombre, que es de donde el puente de la
 * grabadora saca cuántas pulseras hacer. Sirve para repetir un grabado:
 * una si salió mal, o varias si la farmacia pide más.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  await requireAdmin();
  const file = await prisma.laserFile.findUnique({ where: { id: params.id } });
  if (!file) return new NextResponse('Archivo no encontrado', { status: 404 });

  const pedidas = Number(new URL(req.url).searchParams.get('units'));
  const nombre = Number.isFinite(pedidas) && pedidas >= 1
    ? conCantidadEnNombre(file.filename, pedidas)
    : file.filename;

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': 'application/dxf; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(nombre)}"`,
      'Content-Length': String(file.size),
      'Cache-Control': 'no-store',
    },
  });
}
