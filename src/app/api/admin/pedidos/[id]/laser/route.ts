import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildDxfFilename,
  extractUniqueEngravings,
  generateDxfForLines,
  generateSvgPreview,
  todayMadridYmd,
} from '@/lib/laser';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pedidos/[id]/laser
 *
 * Query params:
 *   line     = índice (0-based) del grabado único a generar (0 = primero)
 *   format   = 'dxf' (default) | 'svg' (preview)
 *   inline   = '1' para abrir en el navegador en vez de descargar
 *
 * Ejemplos:
 *   /api/admin/pedidos/xxx/laser?line=0            → DXF descarga
 *   /api/admin/pedidos/xxx/laser?line=0&format=svg → SVG preview inline
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  // Solo admin (VIEWER incluido — es solo lectura de un archivo)
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!order) {
    return new NextResponse('Pedido no encontrado', { status: 404 });
  }

  const engravings = extractUniqueEngravings(order.items);
  if (engravings.length === 0) {
    return new NextResponse('El pedido no tiene textos para grabar', { status: 400 });
  }

  const url = new URL(req.url);
  const lineIdx = Number(url.searchParams.get('line') ?? '0');
  const format = (url.searchParams.get('format') ?? 'dxf').toLowerCase();
  const inline = url.searchParams.get('inline') === '1';

  if (lineIdx < 0 || lineIdx >= engravings.length) {
    return new NextResponse(
      `Índice fuera de rango. Este pedido tiene ${engravings.length} grabado(s) único(s).`,
      { status: 400 },
    );
  }

  const eng = engravings[lineIdx];

  try {
    if (format === 'svg') {
      // Con el color de la pulsera: la vista previa sale sobre la correa
      // negra o roja que toca, para no grabar sobre la equivocada.
      const svg = await generateSvgPreview(eng.lines, undefined, eng.color);
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    const dxf = await generateDxfForLines(eng.lines);
    const filename = buildDxfFilename({
      orderNumber: order.number,
      pharmacyName: order.pharmacyName,
      lineIndex: lineIdx + 1,
      lineText: eng.lines[0],
      color: eng.color,
      units: eng.totalUnits,
    });

    const dxfBuffer = Buffer.from(dxf, 'utf-8');

    // Guardar en LaserFile para el histórico (Fase 2A). Si falla la
    // persistencia por cualquier motivo, seguimos sirviendo el DXF
    // igualmente — la descarga siempre debe funcionar aunque el
    // archivado falle.
    try {
      const session = await requireAdmin();
      await prisma.laserFile.create({
        data: {
          orderId: order.id,
          orderNumber: order.number,
          pharmacyName: order.pharmacyName,
          cif: order.cif,
          filename,
          data: dxfBuffer,
          size: dxfBuffer.length,
          line1: eng.lines[0] ?? '',
          line2: eng.lines[1] ?? null,
          line3: eng.lines[2] ?? null,
          linesJoined: eng.lines.join(' · '),
          color: eng.color,
          totalUnits: eng.totalUnits,
          dateFolder: todayMadridYmd(),
          createdBy: session.email,
        },
      });
    } catch (persistErr) {
      // eslint-disable-next-line no-console
      console.error('[laser] no se pudo archivar el DXF:', persistErr);
    }

    return new NextResponse(new Uint8Array(dxfBuffer), {
      headers: {
        'Content-Type': 'application/dxf; charset=utf-8',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al generar el archivo láser';
    return new NextResponse(msg, { status: 500 });
  }
}
