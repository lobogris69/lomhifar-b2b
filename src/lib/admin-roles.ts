/**
 * Roles disponibles para usuarios administradores.
 * Los almacenamos como string en BD (compat Prisma sin enums).
 */
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'ORDER_MANAGER';

export const ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'];

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super-Admin',
  ADMIN: 'Administrador',
  ORDER_MANAGER: 'Gestor de pedidos',
};

export const ADMIN_ROLE_DESCRIPTION: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Acceso total y gestión de usuarios admin',
  ADMIN: 'Acceso total excepto crear/borrar otros usuarios admin',
  ORDER_MANAGER: 'Solo ver pedidos y cambiar su estado',
};

/**
 * Permisos por funcionalidad. Mantén esto sincronizado con los checks
 * en server actions y layouts protegidos.
 */
export const PERMISSIONS = {
  // Configuración global (precios, portes, emails, etc.)
  CONFIG_WRITE: ['SUPER_ADMIN', 'ADMIN'] as AdminRole[],
  // Clientes (alta, edición, eliminación, importar Excel)
  CUSTOMERS_WRITE: ['SUPER_ADMIN', 'ADMIN'] as AdminRole[],
  // Solicitudes (aprobar/rechazar)
  APPLICATIONS_WRITE: ['SUPER_ADMIN', 'ADMIN'] as AdminRole[],
  // Cartel + imágenes del sitio
  ASSETS_WRITE: ['SUPER_ADMIN', 'ADMIN'] as AdminRole[],
  // Pedidos (cambiar estado, notas) — todos los roles
  ORDERS_WRITE: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'] as AdminRole[],
  // Gestión de usuarios admin
  USERS_MANAGE: ['SUPER_ADMIN'] as AdminRole[],
} as const;

export function hasPermission(role: string, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as AdminRole[]).includes(role as AdminRole);
}

/**
 * Rutas accesibles por rol. Las rutas no listadas se asumen accesibles
 * para todos los roles (después de auth básica).
 */
export const ROLE_ALLOWED_PATHS: Record<AdminRole, RegExp[]> = {
  SUPER_ADMIN: [/.*/],
  ADMIN: [
    /^\/admin$/,
    /^\/admin\/clientes/,
    /^\/admin\/solicitudes/,
    /^\/admin\/pedidos/,
    /^\/admin\/stock/,
    /^\/admin\/importar/,
    /^\/admin\/cartel/,
    /^\/admin\/imagenes/,
    /^\/admin\/textos/,
    /^\/admin\/personas/,
    /^\/admin\/configuracion/,
    /^\/admin\/perfil/,
  ],
  ORDER_MANAGER: [
    /^\/admin$/,
    /^\/admin\/pedidos/,
    /^\/admin\/perfil/,
  ],
};

export function canAccessPath(role: string, pathname: string): boolean {
  const patterns = ROLE_ALLOWED_PATHS[role as AdminRole];
  if (!patterns) return false;
  return patterns.some((p) => p.test(pathname));
}
