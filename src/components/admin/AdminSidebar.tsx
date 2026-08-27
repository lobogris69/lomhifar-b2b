'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { ChevronDown, LogOut, Menu, UserCog, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_ROLE_LABEL, type AdminRole, canAccessPath } from '@/lib/admin-roles';
import {
  NAV_ARRIBA,
  NAV_GRUPOS,
  enlaceActivo,
  type BadgeKey,
  type NavGroup,
  type NavItem,
} from './nav';

export interface SidebarBadges {
  pendingApplications?: number;
  lowStock?: number;  // nº de colores en stock bajo
}

interface SidebarProps {
  adminEmail: string;
  adminRole: string;
  logo: ReactNode;
  mobileLogo: ReactNode;
  badges?: SidebarBadges;
}

const RECORDATORIO = 'lomhifar.admin.menu';

function cuenta(badges: SidebarBadges | undefined, clave?: BadgeKey): number {
  if (!clave || !badges) return 0;
  return badges[clave] ?? 0;
}

function Chapa({ n }: { n: number }) {
  return (
    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5">
      {n}
    </span>
  );
}

function Enlace({
  item,
  activo,
  badges,
  onClick,
}: {
  item: NavItem;
  activo: boolean;
  badges?: SidebarBadges;
  onClick?: () => void;
}) {
  const n = cuenta(badges, item.badgeKey);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        activo
          ? 'bg-brand-700 text-white font-semibold shadow-sm'
          : 'text-ink-200 font-medium hover:bg-white/5 hover:text-white',
      )}
    >
      <item.icon
        className={cn('h-4 w-4 shrink-0', activo ? 'text-white' : 'text-ink-400 group-hover:text-white')}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {item.pista && (
          <span
            className={cn(
              'block truncate text-[10px] font-normal leading-tight',
              activo ? 'text-brand-100' : 'text-ink-500',
            )}
          >
            {item.pista}
          </span>
        )}
      </span>
      {n > 0 && <Chapa n={n} />}
    </Link>
  );
}

/**
 * Un bloque del menú, que se abre y se cierra.
 *
 * Cerrado deja ver de un vistazo los cuatro sitios a los que se puede ir;
 * abierto, el detalle. Se recuerda cómo lo dejaste, y el bloque de la página
 * en la que estás se abre solo.
 */
function Bloque({
  grupo,
  activo,
  abierto,
  alternar,
  badges,
  onLinkClick,
}: {
  grupo: NavGroup;
  activo: string | null;
  abierto: boolean;
  alternar: () => void;
  badges?: SidebarBadges;
  onLinkClick?: () => void;
}) {
  const dentro = grupo.items.some((i) => i.href === activo);
  const pendientes = grupo.items.reduce((a, i) => a + cuenta(badges, i.badgeKey), 0);

  return (
    <div>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5',
          dentro ? 'text-white' : 'text-ink-300 hover:text-white',
        )}
      >
        <grupo.icon className={cn('h-4 w-4 shrink-0', dentro ? 'text-brand-300' : 'text-ink-500')} />
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider">
          {grupo.label}
        </span>
        {!abierto && pendientes > 0 && <Chapa n={pendientes} />}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-ink-500 transition-transform',
            abierto && 'rotate-180',
          )}
        />
      </button>

      {abierto && (
        <div className="mt-0.5 ml-4 space-y-0.5 border-l border-white/10 pb-1 pl-2">
          {grupo.items.map((i) => (
            <Enlace
              key={i.href}
              item={i}
              activo={i.href === activo}
              badges={badges}
              onClick={onLinkClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** El menú entero. Lo comparten la barra de escritorio y el cajón del móvil. */
function Navegacion({
  adminRole,
  badges,
  onLinkClick,
}: {
  adminRole: string;
  badges?: SidebarBadges;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const activo = enlaceActivo(pathname);

  const arriba = NAV_ARRIBA.filter((n) => canAccessPath(adminRole, n.href));
  const grupos = NAV_GRUPOS
    .map((g) => ({ ...g, items: g.items.filter((i) => canAccessPath(adminRole, i.href)) }))
    .filter((g) => g.items.length > 0);

  // Lo que el usuario haya abierto o cerrado a mano. Se lee después del primer
  // pintado: en el servidor no hay localStorage, y mirarlo antes dejaría el
  // menú distinto en cliente y servidor.
  const [aMano, setAMano] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(RECORDATORIO);
      if (guardado) setAMano(JSON.parse(guardado));
    } catch {
      // Sin recuerdo se abre el bloque de la página actual, que ya sirve.
    }
  }, []);

  function alternar(id: string, abiertoAhora: boolean) {
    setAMano((prev) => {
      const siguiente = { ...prev, [id]: !abiertoAhora };
      try {
        window.localStorage.setItem(RECORDATORIO, JSON.stringify(siguiente));
      } catch {
        // Si el navegador no deja guardar, al menos funciona esta sesión.
      }
      return siguiente;
    });
  }

  return (
    <div className="space-y-0.5">
      {arriba.map((n) => (
        <Enlace
          key={n.href}
          item={n}
          activo={n.href === activo}
          badges={badges}
          onClick={onLinkClick}
        />
      ))}

      <div className="space-y-1 border-t border-white/10 pt-3 mt-3">
        {grupos.map((g) => {
          const dentro = g.items.some((i) => i.href === activo);
          const abierto = aMano[g.id] ?? dentro;
          return (
            <Bloque
              key={g.id}
              grupo={g}
              activo={activo}
              abierto={abierto}
              alternar={() => alternar(g.id, abierto)}
              badges={badges}
              onLinkClick={onLinkClick}
            />
          );
        })}
      </div>
    </div>
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

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-ink-950 text-white">
      <div className="px-5 py-6 border-b border-white/10">{logo}</div>
      <nav className="flex-1 overflow-y-auto p-3">
        <Navegacion adminRole={adminRole} badges={badges} />
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
  const close = () => setOpen(false);

  // Badge total para el icono hamburguesa
  const totalBadges = [...NAV_ARRIBA, ...NAV_GRUPOS.flatMap((g) => g.items)]
    .filter((n) => canAccessPath(adminRole, n.href))
    .reduce((a, n) => a + cuenta(badges, n.badgeKey), 0);

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
            <nav className="flex-1 overflow-y-auto p-3">
              <Navegacion adminRole={adminRole} badges={badges} onLinkClick={close} />
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
