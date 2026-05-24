import Link from 'next/link';
import { Logo } from '../brand/Logo';

export async function PublicHeader() {
  return (
    <header className="border-b border-ink-100 bg-white/85 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" aria-label="Lomhifar">
          <Logo showTagline size="md" />
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/acceso" className="btn-ghost">
            Acceder
          </Link>
          <Link href="/solicitud" className="btn-primary">
            Soy una farmacia nueva
          </Link>
        </nav>
      </div>
    </header>
  );
}

export async function PublicFooter() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
        </div>
        <div className="text-sm text-ink-500 text-center md:text-right">
          © {new Date().getFullYear()} Lomhifar · Canal exclusivo farmacia
          <div className="text-xs text-ink-400 mt-0.5">
            Plataforma B2B para farmacias autorizadas. Uso restringido.
          </div>
        </div>
      </div>
    </footer>
  );
}
