import { NextResponse } from 'next/server';
import { rechazoDeAutenticacion, trabajosPendientes } from '@/lib/laser-cola';
import { getLaserProfiles } from '@/lib/laser-profiles';
import { getPerfilesLlavero } from '@/lib/llaveros';
import { llaverosPendientes } from '@/lib/llaveros-cola';
import { getPuntero, REFERENCIAS } from '@/lib/laser-puntero';

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
  // Las pulseras primero: son pedidos de clientes que esperan. Los llaveros
  // son una prueba de taller y pueden aguardar su turno.
  const [trabajos, llaveros, perfiles, perfilesLlavero, puntero] = await Promise.all([
    trabajosPendientes(),
    llaverosPendientes(),
    getLaserProfiles(),
    getPerfilesLlavero(),
    getPuntero(),
  ]);

  // Los perfiles van todos en la misma lista, que es lo que el puente sabe
  // leer, y cada material apunta al suyo. Los de las pulseras no se tocan.
  const perfilesTodos = {
    perfiles: [...perfiles.perfiles, ...perfilesLlavero.perfiles],
    porColor: { ...perfiles.porColor, ...perfilesLlavero.porMaterial },
  };

  // El puntero viaja con la cola: el puente pregunta cada pocos segundos y
  // aquí se le dice qué referencia tiene que estar enseñando.
  return NextResponse.json(
    {
      trabajos: [...trabajos, ...llaveros],
      perfiles: perfilesTodos,
      puntero: { modo: puntero, fichero: REFERENCIAS[puntero].fichero },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
