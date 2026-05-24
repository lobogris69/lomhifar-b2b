import Link from 'next/link';
import { Images, Crosshair, ArrowRight } from 'lucide-react';
import { getAllSiteImageMeta, GROUP_LABELS, SLOTS } from '@/lib/site-images';
import { Alert } from '@/components/ui/Alert';
import { SlotCard } from './SlotCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Imágenes del sitio · Admin Lomhifar' };

export default async function ImagesPage() {
  const metas = await getAllSiteImageMeta();
  const metaBySlot = new Map(metas.map((m) => [m.slot, m]));

  // Agrupar slots por categoría
  const byGroup = SLOTS.reduce<Record<string, typeof SLOTS>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-10 max-w-7xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Images className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Imágenes del sitio</h1>
          <p className="section-subtitle">
            Sube tus propias imágenes para reemplazar cualquier gráfico del sitio.
            El cambio es inmediato. Puedes restaurar la versión por defecto en cualquier
            momento.
          </p>
        </div>
      </div>

      <Alert variant="info" className="mb-4">
        Las imágenes se almacenan en la base de datos (no en el sistema de archivos),
        por lo que son persistentes incluso en despliegues efímeros como Railway.
        Tamaño máximo por imagen: 6 MB.
      </Alert>

      <Link
        href="/admin/imagenes/pulseras"
        className="card p-4 mb-8 flex items-center gap-4 hover:shadow-card transition-shadow border-brand-200 bg-brand-50/40"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 shrink-0">
          <Crosshair className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink-900">
            Configurar área de grabado del configurador
          </div>
          <div className="text-xs text-ink-600">
            Tras subir las fotos &laquo;Pulsera NEGRA&raquo; y &laquo;Pulsera ROJA&raquo;,
            define en qué zona de cada foto se superpondrá el texto que escriba el cliente.
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-brand-700 shrink-0" />
      </Link>

      <div className="space-y-12">
        {Object.entries(byGroup).map(([groupKey, slots]) => (
          <section key={groupKey}>
            <h2 className="text-lg font-semibold text-ink-900 mb-1">
              {GROUP_LABELS[groupKey as keyof typeof GROUP_LABELS]}
            </h2>
            <p className="text-sm text-ink-500 mb-4">
              {slots.length} {slots.length === 1 ? 'imagen' : 'imágenes'}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {slots.map((def) => {
                const meta = metaBySlot.get(def.slot)!;
                return (
                  <SlotCard
                    key={def.slot}
                    slot={def.slot}
                    label={def.label}
                    description={def.description}
                    recommended={def.recommended}
                    accept={def.accept}
                    aspect={def.aspect}
                    hasComponentFallback={def.hasComponentFallback}
                    isCustom={meta.isCustom}
                    hasImage={meta.hasImage}
                    filename={meta.filename}
                    size={meta.size}
                    updatedAt={meta.updatedAt}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
