import { NextResponse } from 'next/server';
import { rechazoDeAutenticacion } from '@/lib/laser-cola';
import { guardarLatido } from '@/lib/laser-estado';

export const dynamic = 'force-dynamic';

/**
 * POST /api/laser/estado
 *
 * Latido del puente del taller: «sigo vivo, el pedal responde, tengo N en
 * cola». La web lo guarda para poder decir en pantalla si la grabadora está
 * lista, sin que nadie tenga que mirar la ventana del programa.
 */
export async function POST(req: Request) {
  const rechazo = await rechazoDeAutenticacion(req);
  if (rechazo) {
    return NextResponse.json({ error: rechazo }, { status: 401 });
  }

  let cuerpo: Record<string, unknown> = {};
  try {
    cuerpo = await req.json();
  } catch {
    // Un latido sin cuerpo sigue valiendo: lo importante es que llegó.
  }

  await guardarLatido({
    pedal: Boolean(cuerpo.pedal),
    enCola: Number(cuerpo.enCola) || 0,
    haciendo: typeof cuerpo.haciendo === 'string' ? cuerpo.haciendo : undefined,
  });

  return NextResponse.json({ ok: true });
}
