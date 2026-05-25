import Link from 'next/link';
import { Megaphone } from 'lucide-react';

/**
 * Versión compacta para la barra de navegación del cliente.
 *
 * NOTA: el banner grande (PosterCalloutLarge) vive en su propio archivo
 * porque usa getSiteImageMeta() que importa node:fs / node:path. Si los
 * ponemos juntos, webpack intenta bundle-arlos al client cuando este
 * archivo es importado por ShopHeader.tsx ('use client').
 */
export function PosterCalloutInline() {
  return (
    <Link
      href="/api/cartel"
      className="hidden lg:inline-flex items-center gap-2 text-xs font-medium text-brand-700 hover:text-brand-800 hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors"
      title="Descargar cartel promocional"
    >
      <Megaphone className="h-3.5 w-3.5" />
      Cartel para mostrador
    </Link>
  );
}

// PosterCalloutLarge se importa directamente desde './PosterCalloutLarge'
// (no se re-exporta aquí porque ese archivo usa node:fs/path y rompería
// el bundle del cliente si lo arrastrara ShopHeader.tsx).
