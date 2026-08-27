import { NextResponse } from 'next/server';
import { rechazoDeAutenticacion, trabajosPendientes } from '@/lib/laser-cola';

export const dynamic = 'force-dynamic';

/**
 * GET /api/laser/cola
 *
 * Lo que el puente de la grabadora tiene pendiente de grabar. Se autentica
 * con `Authorization: Bearer <clave>`; la clave se genera en /admin/laser.
 *
 * No lleva sesión de admin a propósito: quien llama es un programa en el PC
 * del taller, no una persona con navegador.
 */
export async function GET(req: Request) {
  const rechazo = await rechazoDeAutenticacion(req);
  if (rechazo) {
    return NextResponse.json({ error: rechazo }, { status: 401 });
  }

  const trabajos = await trabajosPendientes();
  return NextResponse.json(
    { trabajos },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
