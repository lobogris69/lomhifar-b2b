import { Download, Eye, FileText, Megaphone, Trash2, Image as ImageIcon, QrCode, MessageCircle } from 'lucide-react';
import { getCurrentPosterMeta } from '@/lib/poster';
import { formatDate } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { deletePoster } from './actions';
import { UploadForm } from './UploadForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cartel promocional Â· Admin Lomhifar' };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default async function PosterPage() {
  const meta = await getCurrentPosterMeta();

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Cartel promocional para farmacias</h1>
          <p className="section-subtitle">
            Cada farmacia descarga este cartel desde su Ã¡rea privada para imprimirlo
            y exponerlo en mostrador.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Preview / estado */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-900">Cartel actual</h2>
              {meta.isCustom ? (
                <span className="badge-brand">Personalizado</span>
              ) : (
                <span className="badge-muted">Por defecto (Lomhifar)</span>
              )}
            </div>
            <div className="p-5 grid sm:grid-cols-[180px,1fr] gap-5 items-start">
              {/* Miniatura */}
              <div className="rounded-lg overflow-hidden border border-ink-100 bg-ink-50/40">
                {meta.isCustom && meta.mimeType.startsWith('image/') ? (
                  <img
                    src={`/api/cartel?inline=1&v=${meta.uploadedAt?.getTime() ?? 0}`}
                    alt="Cartel actual"
                    className="w-full h-auto"
                  />
                ) : (
                  /* Para PDFs mostramos el preview generado del por defecto;
                     si es un PDF subido por el admin, mostramos un icono */
                  meta.isCustom ? (
                    <div className="aspect-[1/1.414] flex flex-col items-center justify-center bg-white">
                      <FileText className="h-12 w-12 text-brand-600" />
                      <span className="mt-2 text-xs text-ink-500">PDF subido</span>
                    </div>
                  ) : (
                    <img
                      src="/downloads/cartel-preview.png"
                      alt="Cartel por defecto"
                      className="w-full h-auto"
                    />
                  )
                )}
              </div>

              <div className="text-sm space-y-2">
                <Row k="Archivo" v={meta.filename} />
                <Row k="Tipo" v={meta.mimeType} />
                <Row k="TamaÃ±o" v={formatBytes(meta.size)} />
                {meta.uploadedAt && (
                  <Row k="Subido" v={formatDate(meta.uploadedAt)} />
                )}

                <div className="pt-3 flex flex-wrap gap-2">
                  <a
                    href="/api/cartel?inline=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <Eye className="h-4 w-4" /> Previsualizar
                  </a>
                  <a href="/api/cartel" className="btn-secondary">
                    <Download className="h-4 w-4" /> Descargar PDF
                  </a>
                  {meta.isCustom && (
                    <form action={deletePoster}>
                      <button type="submit" className="btn-ghost text-danger">
                        <Trash2 className="h-4 w-4" /> Restaurar el cartel por defecto
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Descargas extras (solo para el cartel por defecto que lleva QR
              generado por scripts/regenerate-poster-with-qr.mjs).
              Para PNG hay que mostrar el bloque siempre — la versión por
              defecto siempre tiene PNG aunque el admin haya subido un PDF
              personalizado, porque sirve como recurso de marketing fijo. */}
          {!meta.isCustom && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-ink-900">
                  Compartir por WhatsApp / redes
                </h3>
              </div>
              <p className="text-xs text-ink-500 mb-4">
                El PDF de arriba es para imprimir. Para enviar por WhatsApp
                (que se previsualice en el chat) usa el PNG. El QR independiente
                es útil cuando solo quieres enviar el enlace al catálogo.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <DownloadCard
                  href="/api/cartel/png"
                  preview="/api/cartel/png?inline=1"
                  title="Cartel completo (PNG)"
                  desc="Imagen para WhatsApp · 1323 × 2043 px"
                  icon={ImageIcon}
                />
                <DownloadCard
                  href="/api/cartel/qr"
                  preview="/api/cartel/qr?inline=1"
                  title="Sólo el QR + URL"
                  desc="Para enviar solo el código de acceso · 800 × 800 px"
                  icon={QrCode}
                />
              </div>
              <p className="mt-3 text-[11px] text-ink-400">
                Si en algún momento cambia el dominio público, regenera estos
                archivos con <code className="bg-ink-100 px-1.5 py-0.5 rounded text-[10px]">node scripts/regenerate-poster-with-qr.mjs</code>.
              </p>
            </div>
          )}

          <Alert variant="info">
            Las farmacias ven este cartel desde su panel y al finalizar cualquier
            pedido. Si subes uno nuevo, el cambio es inmediato para todas.{' '}
            <strong>Importante:</strong> la miniatura que aparece junto al botón de
            descarga es independiente — actualízala en{' '}
            <a href="/admin/imagenes" className="underline font-semibold">
              Imágenes del sitio
            </a>{' '}
            (slot «Miniatura del cartel») cuando cambies el cartel.
          </Alert>
        </div>

        {/* Upload */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-ink-900 mb-1">Subir cartel personalizado</h2>
            <p className="text-xs text-ink-500 mb-4">
              Recomendado: PDF en A4 vertical (210Ã—297 mm), peso bajo (&lt; 4 MB),
              colores compatibles con impresiÃ³n domÃ©stica.
            </p>
            <UploadForm />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[11px] uppercase tracking-wider text-ink-400 w-16 shrink-0">{k}</span>
      <span className="text-ink-800 break-all">{v}</span>
    </div>
  );
}

function DownloadCard({
  href,
  preview,
  title,
  desc,
  icon: Icon,
}: {
  href: string;
  preview: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white overflow-hidden">
      <div className="bg-ink-50/40 p-3 flex items-center justify-center min-h-[120px]">
        <img
          src={preview}
          alt={title}
          className="max-h-[110px] w-auto rounded-md shadow-sm"
        />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
          <Icon className="h-3.5 w-3.5 text-brand-700" />
          {title}
        </div>
        <div className="text-[11px] text-ink-500 mt-0.5">{desc}</div>
        <a
          href={href}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline"
        >
          <Download className="h-3 w-3" /> Descargar
        </a>
      </div>
    </div>
  );
}
