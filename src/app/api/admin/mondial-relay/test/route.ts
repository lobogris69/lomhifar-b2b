import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { testConnection } from '@/lib/mondial-relay';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint privado de admin para probar las credenciales de Mondial Relay
 * sin crear ningún envío. Solo invoca la búsqueda de puntos de recogida
 * con un CP de prueba (Madrid 28013) para verificar que la firma se
 * acepta.
 */
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 });
  }
  const result = await testConnection();
  return NextResponse.json(result);
}
