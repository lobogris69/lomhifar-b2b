import Link from 'next/link';
import { Download, Megaphone, Printer } from 'lucide-react';
import { getAllSiteTexts } from '@/lib/site-texts';
import { getSiteImageMeta } from '@/lib/site-images';

/**
 * Banner promocional grande para usar al final del pedido (confirmación).
 */
export async function PosterCalloutLarge() {
  const [t, thumbMeta] = await Promise.all([
    getAllSiteTexts(),
    getSiteImageMeta('cartel-thumbnail'),
  ]);
  // Si el admin ha subido una miniatura custom desde /admin/imagenes la usamos
  // (con cache-busting). Si no, caemos al PNG estático por defecto.
  const thumbnailUrl = thumbMeta.isCustom && thumbMeta.hasImage
    ? `/api/images/cartel-thumbnail?v=${thumbMeta.updatedAt?.getTime() ?? 0}`
    : '/downloads/cartel-preview.png';
  return (
    <div className="rounded-2xl overflow-hidden border border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-card">
      <div className="grid sm:grid-cols-[1fr,180px]">
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-brand">
              <Megaphone className="h-3 w-3" /> {t['cartel_callout.badge']}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-ink-900">
            {t['cartel_callout.titulo']}
          </h3>
          <p className="mt-2 text-sm text-ink-600 leading-relaxed max-w-prose">
            {t['cartel_callout.descripcion']}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/api/cartel"
              className="btn-primary"
              download
            >
              <Download className="h-4 w-4" /> {t['cartel_callout.cta']}
            </a>
            <a
              href="/api/cartel?inline=1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <Printer className="h-4 w-4" /> Previsualizar
            </a>
          </div>
        </div>
        <div className="hidden sm:flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200/60 p-4">
          <img
            src={thumbnailUrl}
            alt="Vista previa del cartel"
            className="max-h-44 w-auto rounded shadow-soft"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Versión compacta para la barra de navegación del cliente.
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
