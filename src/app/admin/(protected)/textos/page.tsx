import { Type, ExternalLink, ArrowRight } from 'lucide-react';
import { getAllSiteTextsWithMeta } from '@/lib/site-texts';
import { Alert } from '@/components/ui/Alert';
import { TextSlotEditor } from './TextSlotEditor';
import { GroupThumbnail } from './GroupThumbnail';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Textos del sitio · Admin Lomhifar' };

/**
 * Metadata visual por grupo: dónde aparece + cómo llegar a verlo.
 * `anchor` se concatena al URL con #scroll-{anchor} para que la página
 * pública pueda hacer scroll + highlight al recibir el hash.
 */
interface GroupMeta {
  url: string;
  anchor?: string;
  icon: string;
  where: string;          // descripción corta de DÓNDE aparece (1 frase)
  thumbnail: string;      // qué dibujo usar (clave del GroupThumbnail)
}

const GROUP_META: Record<string, GroupMeta> = {
  general: {
    url: '/', icon: '🌐', thumbnail: 'header-footer',
    where: 'Cabecera (botones de arriba) y pie de página. Visibles en TODAS las páginas públicas.',
  },
  acceso: {
    url: '/acceso', icon: '🔐', thumbnail: 'login',
    where: 'Página de inicio de sesión de farmacias (cuando entran con CIF + email).',
  },
  codigo: {
    url: '/acceso', icon: '✉️', thumbnail: 'code',
    where: 'Pantalla donde se introduce el código de 6 dígitos enviado por email.',
  },
  landing: {
    url: '/', anchor: 'hero', icon: '🏠', thumbnail: 'hero',
    where: 'Hero de la portada: primer bloque grande con título, descripción, CTAs y foto de pulsera.',
  },
  casos: {
    url: '/', anchor: 'casos', icon: '👥', thumbnail: 'casos',
    where: 'Sección de la portada con 6 tarjetas de casos reales (Sofía, Carmen, Andrés...).',
  },
  stats: {
    url: '/', anchor: 'stats', icon: '📊', thumbnail: 'stats',
    where: 'Sección oscura de la portada con cifras de mercado (diabéticos, alérgicos...).',
  },
  personas: {
    url: '/', anchor: 'personas', icon: '🧒', thumbnail: 'personas',
    where: 'Sección con las 8 tarjetas de perfiles (Niños, Adolescentes, Embarazadas...).',
  },
  guia: {
    url: '/', anchor: 'guia', icon: '💡', thumbnail: 'guia',
    where: 'Guía para el farmacéutico — cuándo recomendar la pulsera + frase del mostrador.',
  },
  producto: {
    url: '/', anchor: 'producto', icon: '📦', thumbnail: 'producto',
    where: 'Sección "El producto" con especificaciones técnicas de la pulsera.',
  },
  pvpr: {
    url: '/', anchor: 'producto', icon: '💰', thumbnail: 'pvpr',
    where: 'Tarjeta verde con el precio recomendado al paciente (dentro de "El producto").',
  },
  canal: {
    url: '/', anchor: 'canal', icon: '🏥', thumbnail: 'canal',
    where: 'Sección "Diseñado por y para la oficina de farmacia" — 6 ventajas del canal B2B.',
  },
  cta_final: {
    url: '/', anchor: 'cta-final', icon: '🎯', thumbnail: 'cta',
    where: 'Banner magenta final con CTA "¿Su farmacia trabaja ya con Lomhifar?"',
  },
  tienda: {
    url: '/tienda', icon: '⚙️', thumbnail: 'configurador',
    where: 'Configurador de pulseras: pasos 1-4 + texto del checkbox de confirmación.',
  },
  carrito: {
    url: '/tienda/carrito', icon: '🛒', thumbnail: 'carrito',
    where: 'Página del carrito: título, descripción, botón final y checkbox legal.',
  },
  mispedidos: {
    url: '/tienda/pedidos', icon: '📋', thumbnail: 'mispedidos',
    where: 'Página de "Mis pedidos" (histórico del cliente).',
  },
  pedido_ok: {
    url: '/tienda/pedidos', icon: '✅', thumbnail: 'pedidook',
    where: 'Banner verde de "¡Pedido enviado!" tras confirmar un pedido.',
  },
  solicitud: {
    url: '/solicitud', icon: '📝', thumbnail: 'solicitud',
    where: 'Formulario de alta de farmacia nueva.',
  },
  solicitud_ok: {
    url: '/solicitud/enviada', icon: '✉️', thumbnail: 'solicitudok',
    where: 'Confirmación tras enviar el formulario de alta.',
  },
  cartel_callout: {
    url: '/tienda/pedidos', icon: '📢', thumbnail: 'cartel',
    where: 'Banner magenta con la descarga del cartel para imprimir en el mostrador.',
  },
};

export default async function TextsPage() {
  const slots = await getAllSiteTextsWithMeta();

  // Agrupar por grupo (preservando el orden de definición de TEXT_SLOTS)
  const byGroup = slots.reduce<Record<string, typeof slots>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

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
            Cada grupo tiene una miniatura y una descripción para que sepas
            exactamente qué zona estás cambiando.
          </p>
        </div>
      </div>

      <Alert variant="info" className="mb-8">
        <strong>Cómo funciona:</strong> al guardar un texto, sustituye al original
        en la página. Si borras el campo o pulsas <em>Restaurar default</em>,
        vuelve al texto base del sistema. Pulsa &laquo;Ver en la web&raquo; para abrir
        la página y ver la zona resaltada en magenta durante unos segundos.
      </Alert>

      <div className="space-y-12">
        {Object.entries(byGroup).map(([groupKey, items]) => {
          const meta = GROUP_META[groupKey];
          const customCount = items.filter((s) => s.isCustom).length;
          const fullUrl = meta
            ? meta.anchor
              ? `${meta.url}#scroll-${meta.anchor}`
              : meta.url
            : null;

          return (
            <section key={groupKey} className="rounded-2xl border border-ink-100 bg-white shadow-card overflow-hidden">
              {/* Cabecera del grupo con miniatura + descripción */}
              <div className="grid sm:grid-cols-[160px,1fr] gap-4 p-5 bg-gradient-to-br from-brand-50/60 via-white to-white border-b border-ink-100">
                <GroupThumbnail kind={meta?.thumbnail ?? 'generic'} />
                <div className="flex flex-col">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
                        <span className="text-xl">{meta?.icon ?? '📝'}</span>
                        {items[0]?.groupLabel}
                      </h2>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {items.length} {items.length === 1 ? 'campo editable' : 'campos editables'}
                        {customCount > 0 && (
                          <> · <span className="text-brand-700 font-semibold">
                            {customCount} personalizado(s)
                          </span></>
                        )}
                      </p>
                    </div>
                    {fullUrl && (
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver en la web
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {meta?.where && (
                    <p className="mt-3 text-sm text-ink-700 leading-relaxed">
                      <span className="font-semibold text-ink-900">📍 ¿Dónde aparece?</span>{' '}
                      {meta.where}
                    </p>
                  )}
                </div>
              </div>

              {/* Campos editables */}
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                {items.map((slot) => (
                  <TextSlotEditor key={slot.key} slot={slot} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
