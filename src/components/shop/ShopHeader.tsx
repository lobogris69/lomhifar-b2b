'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { ShoppingCart, ClipboardList, LogOut, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PosterCalloutInline } from './PosterCallout';

interface ShopHeaderProps {
  pharmacyName: string;
  cartCount: number;
  /** Logo renderizado por el server (soporta uploads custom desde /admin/imagenes) */
  logo: ReactNode;
}

const NAV = [
  { href: '/tienda', label: 'Configurador', icon: Sparkles },
  { href: '/tienda/carrito', label: 'Carrito', icon: ShoppingCart },
  { href: '/tienda/pedidos', label: 'Mis pedidos', icon: ClipboardList },
];

export function ShopHeader({ pharmacyName, cartCount, logo }: ShopHeaderProps) {
  const pathname = usePathname();
  return (
    <header className="border-b border-ink-100 bg-white lg:sticky lg:top-0 z-30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between py-3">
          <Link href="/tienda" aria-label="Lomhifar">
            {logo}
          </Link>
          <div className="hidden md:flex items-center gap-3">
            <PosterCalloutInline />
            <div className="text-right pl-3 border-l border-ink-100">
              <div className="text-xs uppercase tracking-wider text-ink-400">Conectado</div>
              <div className="text-sm font-medium text-ink-900">{pharmacyName}</div>
            </div>
            <form action="/api/customer/logout" method="post">
              <button type="submit" className="btn-ghost" title="Cerrar sesión">
                <LogOut className="h-4 w-4" /> Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 -mb-px">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/tienda' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  active
                    ? 'border-brand-700 text-brand-800'
                    : 'border-transparent text-ink-600 hover:text-ink-900',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.href === '/tienda/carrito' && cartCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-700 text-white text-xs px-1.5">
                    {cartCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
