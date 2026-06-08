import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Devuelve el cartel promocional en formato PNG.
 * Útil para compartir por WhatsApp/redes — el chat lo previsualiza como
 * imagen (a diferencia del PDF, que aparece como adjunto).
 *
 * El PNG se genera con scripts/regenerate-poster-with-qr.mjs (incluye
 * el footer con QR + URL). Si no existe, devuelve 404.
 */
export async function GET(req: Request) {
  const pngPath = path.join(
    process.cwd(),
    'public',
    'downloads',
    'cartel-lomhifar-default.png',
  );

  try {
    const data = await fs.readFile(pngPath);
    const url = new URL(req.url);
    const inline = url.searchParams.get('inline') === '1';
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="cartel-lomhifar.png"`,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(data.length),
      },
    });
  } catch {
    return new NextResponse('Cartel PNG no disponible', { status: 404 });
  }
}
