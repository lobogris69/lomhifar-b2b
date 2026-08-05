import Link from 'next/link';
import { Crosshair, ArrowLeft, ExternalLink } from 'lucide-react';
import { getSettings, SETTING_KEYS, parsePrintArea } from '@/lib/settings';
import { getSiteImageMeta } from '@/lib/site-images';
import { AreaEditor } from './AreaEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pulseras del configurador · Admin Lomhifar' };

export default async function ConfiguratorBraceletsPage() {
  const [settings, photoBlack, photoRed] = await Promise.all([
    getSettings(),
    getSiteImageMeta('configurator-bracelet-black'),
    getSiteImageMeta('configurator-bracelet-red'),
  ]);

  const areaBlack = parsePrintArea(settings[SETTING_KEYS.CONFIGURATOR_AREA_BLACK]);
  const areaRed = parsePrintArea(settings[SETTING_KEYS.CONFIGURATOR_AREA_RED]);

  const photoBlackUrl = photoBlack.isCustom && photoBlack.hasImage
    ? `/api/images/configurator-bracelet-black?v=${photoBlack.updatedAt?.getTime() ?? 0}`
    : null;
  const photoRedUrl = photoRed.isCustom && photoRed.hasImage
    ? `/api/images/configurator-bracelet-red?v=${photoRed.updatedAt?.getTime() ?? 0}`
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin/imagenes"
          className="inline-flex items-center text-sm text-ink-500 hover:text-ink-800 mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Imágenes del sitio
        </Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Crosshair className="h-5 w-5" />
          </span>
          <div>
            <h1 className="section-title">Pulseras del configurador</h1>
            <p className="section-subtitle">
              Define el área exacta donde se graba el texto en cada foto real de pulsera.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-8 bg-brand-50/40 border-brand-200">
        <h2 className="text-sm font-semibold text-ink-900 mb-2">Cómo funciona</h2>
        <ol className="text-sm text-ink-700 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>
            Sube las dos fotos reales en{' '}
            <Link href="/admin/imagenes" className="text-brand-700 underline font-medium">
              Imágenes del sitio
            </Link>{' '}
            (slots <em>Pulsera NEGRA</em> y <em>Pulsera ROJA</em>, foto real configurador).
          </li>
          <li>
            En esta pantalla, ajusta el rectángulo de impresión arrastrando los sliders
            hasta que la caja punteada magenta encaje sobre la placa de aluminio de la foto.
          </li>
          <li>
            Cuando el cliente seleccione color y escriba en el configurador, el texto se
            grabará automáticamente sobre la placa de la foto correspondiente, respetando
            ese área.
          </li>
          <li>
            Al guardar, el cambio es inmediato en{' '}
            <a
              href="/tienda"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 underline font-medium inline-flex items-center gap-1"
            >
              /tienda <ExternalLink className="h-3 w-3" />
            </a>.
          </li>
        </ol>
      </div>

      <AreaEditor
        initialBlack={areaBlack}
        initialRed={areaRed}
        photoBlackUrl={photoBlackUrl}
        photoRedUrl={photoRedUrl}
      />
    </div>
  );
}
