import { NextResponse } from 'next/server';
import { getSiteImageBytes } from '@/lib/site-images';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { slot: string } },
) {
  const img = await getSiteImageBytes(params.slot);
  if (!img) {
    return new NextResponse('Image not found', { status: 404 });
  }
  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      'Content-Type': img.mimeType,
      'Cache-Control': 'private, max-age=60, must-revalidate',
      'Content-Length': String(img.data.length),
    },
  });
}
