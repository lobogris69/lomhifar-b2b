'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  ClipboardList,
  Settings,
  Building2,
  LogOut,
  Megaphone,
  Images,
  UserCog,
  Users2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_ROLE_LABEL, type AdminRole, canAccessPath } from '@/lib/admin-roles';

const NAV = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: Building2 },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/importar', label: 'Importar Excel', icon: FileSpreadsheet },
  { href: '/admin/cartel', label: 'Cartel promocional', icon: Megaphone },
  { href: '/admin/imagenes', label: 'Imágenes del sitio', icon: Images },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
  { href: '/admin/usuarios', label: 'Usuarios admin', icon: Users2 },
];

interface SidebarProps {
  adminEmail: string;
  adminRole: string;
  /** Logo renderizado por el server (para soportar uploads custom) */
  logo: ReactNode;
  mobileLogo: ReactNode;
}

export function AdminSidebar({ adminEmail, adminRole, logo }: SidebarProps) {
  const pathname = usePathname();
  const visibleNav = NAV.filter((n) => canAccessPath(adminRole, n.href));

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-ink-950 text-white">
      <div className="px-5 py-6 border-b border-white/10">{logo}</div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map((n) => {
          const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-700 text-white'
                  : 'text-ink-200 hover:bg-white/5 hover:text-white',
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="px-3 py-2">
          <div className="text-xs text-white truncate">{adminEmail}</div>
          <div className="text-[10px] text-brand-200 uppercase tracking-wider mt-0.5">
            {ADMIN_ROLE_LABEL[adminRole as AdminRole] ?? adminRole}
          </div>
        </div>
        <Link
          href="/admin/perfil"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
            pathname.startsWith('/admin/perfil')
              ? 'bg-brand-700 text-white'
              : 'text-ink-200 hover:bg-white/5 hover:text-white',
          )}
        >
          <UserCog className="h-4 w-4" /> Mi perfil
        </Link>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-200 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminMobileTopbar({
  mobileLogo,
}: {
  adminEmail: string;
  mobileLogo: ReactNode;
}) {
  return (
    <div className="lg:hidden flex items-center justify-between bg-ink-950 text-white px-4 py-3">
      {mobileLogo}
      <form action="/api/admin/logout" method="post">
        <button className="btn-ghost text-white">
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
