import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { canAccessPath } from '@/lib/admin-roles';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * La vista previa del llavero, como imagen aparte.
 *
 * Antes iba metida dentro del HTML de la página. Con un dibujo detallado son
 * megas de texto por diseño, y la lista enseña veinte: el navegador se caía
 * al abrir la pestaña. Así el navegador la pide como una imagen más, la
 * pinta, y la página se queda ligera.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  if (!canAccessPath(session.role, '/admin/llaveros')) {
    return new NextResponse('Sin permiso', { status: 403 });
  }

  const t = await prisma.keyringJob.findUnique({
    where: { id: params.id },
    select: { vistaSvg: true },
  });
  if (!t?.vistaSvg) return new NextResponse('Sin vista previa', { status: 404 });

  return new NextResponse(t.vistaSvg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
