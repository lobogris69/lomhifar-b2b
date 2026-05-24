import { Type, ExternalLink } from 'lucide-react';
import { getAllSiteTextsWithMeta } from '@/lib/site-texts';
import { Alert } from '@/components/ui/Alert';
import { TextSlotEditor } from './TextSlotEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Textos del sitio · Admin Lomhifar' };

export default async function TextsPage() {
  const slots = await getAllSiteTextsWithMeta();

  // Agrupar por grupo
  const byGroup = slots.reduce<Record<string, typeof slots>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

  // Mapeo de grupo → URL preview
  const previewUrl: Record<string, string> = {
    acceso: '/acceso',
    tienda: '/tienda',
    general: '/',
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Type className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Textos del sitio</h1>
          <p className="section-subtitle">
            Edita cualquier texto visible en las páginas públicas.
            El cambio es inmediato y reversible.
          </p>
        </div>
      </div>

      <Alert variant="info" className="mb-8">
        <strong>Cómo funciona:</strong> al guardar un texto, sustituye al original
        en la página. Si borras el campo o pulsas <em>Restaurar default</em>,
        vuelve al texto base del sistema.
      </Alert>

      <div className="space-y-10">
        {Object.entries(byGroup).map(([groupKey, items]) => (
          <section key={groupKey}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">
                  {items[0]?.groupLabel}
                </h2>
                <p className="text-xs text-ink-500">
                  {items.length} {items.length === 1 ? 'campo editable' : 'campos editables'}
                  {items.filter((s) => s.isCustom).length > 0 && (
                    <> · <span className="text-brand-700 font-semibold">
                      {items.filter((s) => s.isCustom).length} personalizado(s)
                    </span></>
                  )}
                </p>
              </div>
              {previewUrl[groupKey] && (
                <a
                  href={previewUrl[groupKey]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver página
                </a>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((slot) => (
                <TextSlotEditor key={slot.key} slot={slot} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
