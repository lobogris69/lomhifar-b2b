import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { comoSeVe, estadoDelPuente } from '@/lib/laser-estado';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/laser/estado
 *
 * Lo consulta el navegador cada pocos segundos para pintar el indicador de la
 * grabadora y activar o desactivar el botón de enviar.
 *
 * Aquí no se redirige al login como en las páginas: esto lo llama un fetch, y
 * un 401 limpio es lo que el navegador sabe manejar.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const estado = await estadoDelPuente();
  return NextResponse.json(
    { ...estado, ...comoSeVe(estado) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
