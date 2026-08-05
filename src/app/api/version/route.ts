import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Marcador de versión del deploy. Público y sin efectos. Sirve para saber
 * con certeza qué build está vivo en producción (útil al depurar deploys).
 * Cambiar MARKER en cada cambio que se quiera verificar.
 */
const MARKER = 'laser-color-v1';

export function GET() {
  return NextResponse.json(
    { marker: MARKER },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
