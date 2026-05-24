import { Download, Eye, FileText, Megaphone, Trash2 } from 'lucide-react';
import { getCurrentPosterMeta } from '@/lib/poster';
import { formatDate } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { deletePoster } from './actions';
import { UploadForm } from './UploadForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cartel promocional · Admin Lomhifar' };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default async function PosterPage() {
  const meta = await getCurrentPosterMeta();

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Cartel promocional para farmacias</h1>
          <p className="section-subtitle">
            Cada farmacia descarga este cartel desde su área privada para imprimirlo
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
                <Row k="Tamaño" v={formatBytes(meta.size)} />
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
                    <Download className="h-4 w-4" /> Descargar
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

          <Alert variant="info">
            Las farmacias ven este cartel desde su panel y al finalizar cualquier
            pedido. Si subes uno nuevo, el cambio es inmediato para todas.
          </Alert>
        </div>

        {/* Upload */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-ink-900 mb-1">Subir cartel personalizado</h2>
            <p className="text-xs text-ink-500 mb-4">
              Recomendado: PDF en A4 vertical (210×297 mm), peso bajo (&lt; 4 MB),
              colores compatibles con impresión doméstica.
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
