'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_ROLE_LABEL, type AdminRole, canAccessPath } from '@/lib/admin-roles';

const NAV = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: Building2, badgeKey: 'pendingApplications' as const },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/importar', label: 'Importar Excel', icon: FileSpreadsheet },
  { href: '/admin/cartel', label: 'Cartel promocional', icon: Megaphone },
  { href: '/admin/imagenes', label: 'Imágenes del sitio', icon: Images },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
  { href: '/admin/usuarios', label: 'Usuarios admin', icon: Users2 },
];

export interface SidebarBadges {
  pendingApplications?: number;
}

interface SidebarProps {
  adminEmail: string;
  adminRole: string;
  logo: ReactNode;
  mobileLogo: ReactNode;
  badges?: SidebarBadges;
}

function NavLinks({
  pathname,
  visibleNav,
  badges,
  onClick,
}: {
  pathname: string;
  visibleNav: typeof NAV;
  badges?: SidebarBadges;
  onClick?: () => void;
}) {
  return (
    <>
      {visibleNav.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        const badgeCount = n.badgeKey && badges ? badges[n.badgeKey] : 0;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-brand-700 text-white'
                : 'text-ink-200 hover:bg-white/5 hover:text-white',
            )}
          >
            <n.icon className="h-4 w-4" />
            <span className="flex-1">{n.label}</span>
            {badgeCount && badgeCount > 0 ? (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5">
                {badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

function ProfileBlock({
  adminEmail,
  adminRole,
  pathname,
  onLinkClick,
}: {
  adminEmail: string;
  adminRole: string;
  pathname: string;
  onLinkClick?: () => void;
}) {
  return (
    <div className="p-3 border-t border-white/10">
      <div className="px-3 py-2">
        <div className="text-xs text-white truncate">{adminEmail}</div>
        <div className="text-[10px] text-brand-200 uppercase tracking-wider mt-0.5">
          {ADMIN_ROLE_LABEL[adminRole as AdminRole] ?? adminRole}
        </div>
      </div>
      <Link
        href="/admin/perfil"
        onClick={onLinkClick}
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
  );
}

export function AdminSidebar({ adminEmail, adminRole, logo, badges }: SidebarProps) {
  const pathname = usePathname();
  const visibleNav = NAV.filter((n) => canAccessPath(adminRole, n.href));

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-ink-950 text-white">
      <div className="px-5 py-6 border-b border-white/10">{logo}</div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <NavLinks pathname={pathname} visibleNav={visibleNav} badges={badges} />
      </nav>
      <ProfileBlock adminEmail={adminEmail} adminRole={adminRole} pathname={pathname} />
    </aside>
  );
}

export function AdminMobileTopbar({
  adminEmail,
  adminRole,
  mobileLogo,
  badges,
}: {
  adminEmail: string;
  adminRole: string;
  mobileLogo: ReactNode;
  badges?: SidebarBadges;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visibleNav = NAV.filter((n) => canAccessPath(adminRole, n.href));
  const close = () => setOpen(false);

  // Badge total para el icono hamburguesa
  const totalBadges = visibleNav.reduce(
    (a, n) => a + (n.badgeKey && badges?.[n.badgeKey] ? badges[n.badgeKey]! : 0),
    0,
  );

  return (
    <>
      <div className="lg:hidden flex items-center justify-between bg-ink-950 text-white px-4 py-3 sticky top-0 z-30">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative p-1 -ml-1 rounded hover:bg-white/10"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
          {totalBadges > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 text-amber-950 text-[9px] font-bold px-1">
              {totalBadges}
            </span>
          )}
        </button>
        {mobileLogo}
        <form action="/api/admin/logout" method="post">
          <button className="btn-ghost text-white p-1" aria-label="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={close}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="relative w-72 max-w-[85vw] flex flex-col bg-ink-950 text-white shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              {mobileLogo}
              <button
                type="button"
                onClick={close}
                className="p-1 rounded hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <NavLinks
                pathname={pathname}
                visibleNav={visibleNav}
                badges={badges}
                onClick={close}
              />
            </nav>
            <ProfileBlock
              adminEmail={adminEmail}
              adminRole={adminRole}
              pathname={pathname}
              onLinkClick={close}
            />
          </aside>
        </div>
      )}
    </>
  );
}
