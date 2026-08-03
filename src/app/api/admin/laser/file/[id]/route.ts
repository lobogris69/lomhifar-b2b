import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/laser/file/[id]
 * Devuelve el DXF archivado (Fase 2A histórico).
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await requireAdmin();
  const file = await prisma.laserFile.findUnique({ where: { id: params.id } });
  if (!file) return new NextResponse('Archivo no encontrado', { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': 'application/dxf; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
      'Content-Length': String(file.size),
      'Cache-Control': 'no-store',
    },
  });
}
