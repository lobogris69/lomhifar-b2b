import { NextResponse } from 'next/server';
import { rechazoDeAutenticacion, trabajosPendientes } from '@/lib/laser-cola';
import { getLaserProfiles } from '@/lib/laser-profiles';

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

  // Los perfiles viajan con la cola. El puente tenía su propia copia en el
  // PC del taller, y nadie la actualizaba: cambiar la potencia o la
  // velocidad en /admin/laser no llegaba nunca a la máquina, así que esos
  // campos del panel no servían para nada. Ahora la copia del taller se
  // refresca sola en cada consulta.
  const [trabajos, perfiles] = await Promise.all([
    trabajosPendientes(),
    getLaserProfiles(),
  ]);

  return NextResponse.json(
    { trabajos, perfiles },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
