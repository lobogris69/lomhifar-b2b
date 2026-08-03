import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/laser/zip/[date]
 * date en formato YYYY-MM-DD (Europe/Madrid).
 * Devuelve un ZIP con todos los DXF generados ese día.
 */
export async function GET(
  _req: Request,
  { params }: { params: { date: string } },
) {
  await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    return new NextResponse('Fecha no válida (YYYY-MM-DD)', { status: 400 });
  }

  const files = await prisma.laserFile.findMany({
    where: { dateFolder: params.date },
    orderBy: [{ orderNumber: 'asc' }, { createdAt: 'asc' }],
  });
  if (files.length === 0) {
    return new NextResponse('No hay archivos DXF ese día', { status: 404 });
  }

  const zip = new JSZip();
  const filenamesUsed = new Set<string>();
  for (const f of files) {
    // Si hay duplicados de nombre (mismo pedido re-descargado), añadimos
    // un sufijo -Nº para no pisar en el zip.
    let name = f.filename;
    let n = 2;
    while (filenamesUsed.has(name)) {
      name = f.filename.replace(/\.dxf$/i, `_v${n}.dxf`);
      n += 1;
    }
    filenamesUsed.add(name);
    zip.file(name, f.data);
  }

  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="LOMHIFAR_laser_${params.date}.zip"`,
      'Content-Length': String(buf.length),
      'Cache-Control': 'no-store',
    },
  });
}
