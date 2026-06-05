import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { getAllSiteTexts } from '@/lib/site-texts';

export async function PublicHeader() {
  const t = await getAllSiteTexts();
  return (
    <header className="border-b border-ink-100 bg-white/85 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 py-3">
        <Link href="/" aria-label="Lomhifar">
          <Logo showTagline size="md" />
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2 text-sm shrink-0">
          {/* 'Acceder' = botón secundario (borde + icono candado). Funcional,
              no compite visualmente con el CTA principal magenta, pero queda
              claramente identificable como zona de login para clientes ya
              registrados gracias al icono. */}
          <Link
            href="/acceso"
            className="btn-secondary px-3 py-2 sm:px-4 sm:py-2.5 whitespace-nowrap"
          >
            <LogIn className="h-4 w-4" />
            {t['header.cta_acceder']}
          </Link>
          {/* El CTA primario (captar farmacias nuevas) se oculta en móvil
              pequeño: el botón grande del hero más abajo ya invita a /solicitud
              con el mismo copy y no se sale del viewport. */}
          <Link
            href="/solicitud"
            className="hidden sm:inline-flex btn-primary whitespace-nowrap"
          >
            {t['header.cta_alta']}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export async function PublicFooter() {
  const t = await getAllSiteTexts();
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
        </div>
        <div className="text-sm text-ink-500 text-center md:text-right">
          © {new Date().getFullYear()} Lomhifar · {t['footer.tagline']}
          <div className="text-xs text-ink-400 mt-0.5">
            {t['footer.extra']}
          </div>
        </div>
      </div>
    </footer>
  );
}
