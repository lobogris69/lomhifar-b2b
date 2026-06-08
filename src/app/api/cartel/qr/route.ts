import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Devuelve el QR + URL del catálogo como imagen PNG independiente,
 * para enviar suelto por WhatsApp/email/redes.
 *
 * El PNG se genera con scripts/regenerate-poster-with-qr.mjs apuntando
 * a https://pulseraspersonalizadas.lomhifar.net/.
 */
export async function GET(req: Request) {
  const qrPath = path.join(
    process.cwd(),
    'public',
    'downloads',
    'cartel-qr.png',
  );

  try {
    const data = await fs.readFile(qrPath);
    const url = new URL(req.url);
    const inline = url.searchParams.get('inline') === '1';
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="qr-lomhifar.png"`,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(data.length),
      },
    });
  } catch {
    return new NextResponse('QR no disponible', { status: 404 });
  }
}
