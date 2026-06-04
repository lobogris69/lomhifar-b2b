import { Users, RotateCcw } from 'lucide-react';
import { getSettings, SETTING_KEYS, parsePersonas } from '@/lib/settings';
import { getAllSiteImageMeta } from '@/lib/site-images';
import { Alert } from '@/components/ui/Alert';
import { PersonasEditor } from './PersonasEditor';
import { resetPersonasAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Personas / casos de uso Â· Admin Lomhifar' };

export default async function PersonasAdminPage() {
  const [settings, imageMetas] = await Promise.all([
    getSettings(),
    getAllSiteImageMeta(),
  ]);

  const personas = parsePersonas(settings[SETTING_KEYS.MARKETING_PERSONAS_JSON]);
  const isCustom = (settings[SETTING_KEYS.MARKETING_PERSONAS_JSON] ?? '').length > 0;

  const photoUrls = personas.map((_, i) => {
    const meta = imageMetas.find((m) => m.slot === `persona-${i + 1}`);
    if (meta?.isCustom && meta.hasImage) {
      return `/api/images/persona-${i + 1}?v=${meta.updatedAt?.getTime() ?? 0}`;
    }
    return null;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="section-title">Personas / casos de uso</h1>
            <p className="section-subtitle">
              Edita las 8 tarjetas de la secciÃ³n &laquo;Para todos los pacientes&raquo;
              en la landing. Textos, grabado de la pulsera demo y foto opcional.
            </p>
          </div>
        </div>
        {isCustom && (
          <form action={resetPersonasAction}>
            <button
              type="submit"
              className="btn-secondary text-xs"
              title="Vuelve a los textos originales de Lomhifar"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restaurar 8 personas por defecto
            </button>
          </form>
        )}
      </div>

      <Alert variant="info" className="mb-8">
        <strong>CÃ³mo funciona:</strong> los textos se guardan en la base de datos.
        Cada persona muestra por defecto un dibujo SVG de la pulsera con su grabado.
        Si quieres mostrar una <strong>foto real</strong> en lugar del dibujo, sÃºbela
        en{' '}
        <a href="/admin/imagenes" className="text-brand-700 underline font-medium">
          ImÃ¡genes del sitio
        </a>{' '}
        en el slot correspondiente (persona-1 ... persona-8).
      </Alert>

      <PersonasEditor initialPersonas={personas} photoUrls={photoUrls} />
    </div>
  );
}
