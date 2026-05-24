import { NextResponse } from 'next/server';
import { getCurrentPosterBytes } from '@/lib/poster';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const poster = await getCurrentPosterBytes();
  if (!poster) {
    return new NextResponse('Cartel no disponible', { status: 404 });
  }
  const url = new URL(req.url);
  const inline = url.searchParams.get('inline') === '1';

  return new NextResponse(new Uint8Array(poster.data), {
    headers: {
      'Content-Type': poster.mimeType,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(poster.filename)}"`,
      'Cache-Control': 'private, no-store',
      'Content-Length': String(poster.data.length),
    },
  });
}
