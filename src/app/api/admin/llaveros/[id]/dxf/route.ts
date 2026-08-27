import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { canAccessPath } from '@/lib/admin-roles';
import { prisma } from '@/lib/prisma';
import { esMaterial, nombreDeFicheroLlavero } from '@/lib/llaveros';

export const dynamic = 'force-dynamic';

/**
 * Descarga manual del DXF de un llavero. Lo normal es mandarlo a la
 * grabadora desde la pantalla; esto queda como alternativa, igual que en los
 * pedidos.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  if (!canAccessPath(session.role, '/admin/llaveros')) {
    return new NextResponse('Sin permiso', { status: 403 });
  }

  const t = await prisma.keyringJob.findUnique({ where: { id: params.id } });
  if (!t || !t.dxf) return new NextResponse('Ese diseño no tiene trazado', { status: 404 });

  const nombre = nombreDeFicheroLlavero({
    nombre: t.nombre,
    material: esMaterial(t.material) ? t.material : 'SILVER',
    unidades: t.unidades,
    fecha: t.createdAt,
  });

  return new NextResponse(Buffer.from(t.dxf), {
    headers: {
      'Content-Type': 'application/dxf',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Cache-Control': 'no-store',
    },
  });
}
