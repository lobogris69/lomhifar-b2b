import { NextResponse } from 'next/server';
import {
  devolverALaCola,
  marcarComoGrabado,
  rechazoDeAutenticacion,
} from '@/lib/laser-cola';

export const dynamic = 'force-dynamic';

/**
 * POST /api/laser/cola/[id]/hecho
 *
 * El puente confirma el resultado de un trabajo.
 *
 *   { "ok": true }   → grabado; sale de la cola
 *   { "ok": false }  → no se grabó; vuelve a la cola para reintentarlo
 *
 * Lo segundo importa: si el operario cancela o el trabajo falla, el pedido no
 * puede quedarse marcado como grabado, o se enviaría una pulsera en blanco.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const rechazo = await rechazoDeAutenticacion(req);
  if (rechazo) {
    return NextResponse.json({ error: rechazo }, { status: 401 });
  }

  let ok = true;
  try {
    const cuerpo = await req.json();
    if (cuerpo && typeof cuerpo.ok === 'boolean') ok = cuerpo.ok;
  } catch {
    // Sin cuerpo se asume que fue bien: el puente sólo llama aquí al terminar.
  }

  try {
    if (ok) {
      await marcarComoGrabado(params.id);
    } else {
      await devolverALaCola(params.id);
    }
  } catch {
    return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, grabado: ok });
}
