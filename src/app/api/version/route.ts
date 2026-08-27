import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Qué versión está viva en producción.
 *
 * El panel lo consulta cada minuto. Cuando cambia respecto a la que cargó el
 * navegador, avisa de que hay una versión nueva y ofrece recargar. Sin esto,
 * al publicar un cambio la pestaña abierta se queda con el código viejo: los
 * botones nuevos no aparecen y, peor, al pulsar uno salta un «Application
 * error» genérico. Nos ha costado media tarde de idas y venidas.
 *
 * BUILD_ID lo pone Next en cada compilación, así que cambia solo con cada
 * despliegue y no hay que acordarse de tocar nada.
 */
export function GET() {
  return NextResponse.json(
    {
      version: process.env.NEXT_PUBLIC_BUILD_ID
        || process.env.RAILWAY_GIT_COMMIT_SHA
        || 'desconocida',
      marker: 'laser-color-v1',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
