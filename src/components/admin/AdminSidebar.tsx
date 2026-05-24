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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: Building2 },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/importar', label: 'Importar Excel', icon: FileSpreadsheet },
  { href: '/admin/cartel', label: 'Cartel promocional', icon: Megaphone },
  { href: '/admin/imagenes', label: 'Imágenes del sitio', icon: Images },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

interface SidebarProps {
  adminEmail: string;
  /** Logo renderizado por el server (para soportar uploads custom) */
  logo: ReactNode;
  mobileLogo: ReactNode;
}

export function AdminSidebar({ adminEmail, logo }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-ink-950 text-white">
      <div className="px-5 py-6 border-b border-white/10">{logo}</div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((n) => {
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
        <div className="px-3 py-2 text-xs text-ink-300 truncate">{adminEmail}</div>
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
