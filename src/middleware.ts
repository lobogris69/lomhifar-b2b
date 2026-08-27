import { NextResponse, type NextRequest } from 'next/server';
import { unsealData } from 'iron-session';
import { canAccessPath } from '@/lib/admin-roles';

/**
 * Portero del panel de administración.
 *
 * Hasta ahora el rol solo decidía qué botones se veían en el menú lateral.
 * El layout comprobaba que hubiera sesión, pero nada más: un gestor de
 * pedidos que escribiera /admin/clientes en la barra del navegador entraba
 * y veía las farmacias con sus IBAN. Esconder un enlace no es protegerlo.
 *
 * Aquí se comprueba de verdad, antes de que la página llegue a construirse,
 * y vale para las rutas que se añadan mañana sin acordarse de esto.
 */

const COOKIE = 'lomhifar_admin';
const TTL = 60 * 60 * 8; // igual que la sesión en src/lib/auth.ts

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'INSECURE-DEV-ONLY-SESSION-SECRET-CHANGE-ME-PLEASE-32CHARS';

/** Rutas del panel abiertas a cualquiera que tenga sesión. */
const LIBRES = ['/admin/login', '/admin/perfil'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (LIBRES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE)?.value;
  if (!cookie) return aLogin(req);

  let role: string;
  try {
    const datos = await unsealData<{ role?: string }>(cookie, {
      password: SESSION_SECRET,
      ttl: TTL,
    });
    role = datos?.role ?? '';
  } catch {
    // Cookie caducada, manipulada o firmada con otro secreto.
    return aLogin(req);
  }

  if (!role) return aLogin(req);

  if (!canAccessPath(role, pathname)) {
    // A la portada del panel, que la ve cualquier rol, con un aviso de por
    // qué. Mandarlo al login sería confuso: la sesión es válida, lo que no
    // tiene es permiso.
    const destino = req.nextUrl.clone();
    destino.pathname = '/admin';
    destino.search = '?sinpermiso=1';
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

function aLogin(req: NextRequest) {
  const destino = req.nextUrl.clone();
  destino.pathname = '/admin/login';
  destino.search = '';
  return NextResponse.redirect(destino);
}

export const config = {
  // Solo las páginas del panel. Las rutas /api tienen su propia comprobación
  // en cada handler, y meterlas aquí rompería las que se llaman con clave
  // (el puente de la grabadora) en vez de con sesión.
  matcher: ['/admin/:path*'],
};
