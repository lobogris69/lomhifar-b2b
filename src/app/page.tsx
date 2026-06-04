import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  HeartPulse,
  Sparkles,
  PackageCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

// La landing consulta la BD para resolver el logo/imágenes custom → no se puede prerender estática.
export const dynamic = 'force-dynamic';
import { PublicHeader, PublicFooter } from '@/components/marketing/PublicHeader';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { RealCasesGallery } from '@/components/marketing/RealCasesGallery';
import { PatientPersonas } from '@/components/marketing/PatientPersonas';
import { AwarenessStats } from '@/components/marketing/AwarenessStats';
import { PharmacistGuide } from '@/components/marketing/PharmacistGuide';
import { getAllSiteTexts } from '@/lib/site-texts';
import { getSettings, SETTING_KEYS } from '@/lib/settings';
import { getSiteImageMeta } from '@/lib/site-images';
import { formatEuros } from '@/lib/utils';
import { HashHighlight } from '@/components/HashHighlight';

export default async function LandingPage() {
  const [t, settings, heroBraceletMeta, proporcionMeta] = await Promise.all([
    getAllSiteTexts(),
    getSettings(),
    getSiteImageMeta('acceso-bracelet'),
    getSiteImageMeta('landing-proporcion-real'),
  ]);
  const pvprCents = Number(settings[SETTING_KEYS.PVPR_CENTS]);
  // La misma foto del slot "acceso-bracelet" se reutiliza en el hero de la
  // landing (es la pulsera publicitaria principal). Si no hay foto custom,
  // se sigue mostrando el preview SVG en vivo.
  const heroBraceletUrl = heroBraceletMeta.isCustom && heroBraceletMeta.hasImage
    ? `/api/images/acceso-bracelet?v=${heroBraceletMeta.updatedAt?.getTime() ?? 0}`
    : null;
  // Foto opcional para la tarjeta "Proporción real" dentro de la sección
  // "El producto". Si no hay foto, se sigue mostrando el dibujo SVG con
  // la regla de medidas.
  const proporcionUrl = proporcionMeta.isCustom && proporcionMeta.hasImage
    ? `/api/images/landing-proporcion-real?v=${proporcionMeta.updatedAt?.getTime() ?? 0}`
    : null;
  return (
    <div className="flex min-h-screen flex-col">
      <HashHighlight />
      <PublicHeader />

      <main className="flex-1">
        {/* HERO */}
        <section id="scroll-hero" className="relative overflow-hidden bg-ink-gradient text-white">
          <div className="absolute inset-0 bg-dots-light pointer-events-none" />
          <div
            className="hidden sm:block absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(209,38,134,0.35) 0%, rgba(209,38,134,0) 70%)',
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20 lg:py-28 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-100 backdrop-blur border border-white/10">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t['landing.hero_badge']}
              </span>
              <h1 className="mt-6 text-3xl sm:text-4xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.05] break-words">
                {t['landing.hero_titulo_1']}
                <br />
                <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-white bg-clip-text text-transparent">
                  {t['landing.hero_titulo_destacado']}
                </span>
                <br />
                {t['landing.hero_titulo_2']}
              </h1>
              <p className="mt-6 text-lg text-white/80 max-w-xl leading-relaxed">
                {t['landing.hero_descripcion']}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {/* CTA principal: clientes existentes */}
                <Link
                  href="/acceso"
                  className="group flex-1 inline-flex items-center justify-between gap-3 rounded-xl bg-white text-ink-900 hover:bg-brand-50 hover:text-brand-800 px-5 py-4 shadow-glow transition-colors text-left"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-base sm:text-lg font-semibold leading-tight">
                      {t['landing.hero_cta_principal']}
                    </span>
                    <span className="block text-xs sm:text-sm text-ink-500 mt-0.5">
                      Ya soy cliente de Lomhifar
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-brand-700 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                {/* CTA secundaria: farmacias nuevas */}
                <Link
                  href="/solicitud"
                  className="group flex-1 inline-flex items-center justify-between gap-3 rounded-xl bg-white/5 text-white border border-white/30 hover:bg-white/10 px-5 py-4 transition-colors text-left"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-base sm:text-lg font-semibold leading-tight">
                      {t['landing.hero_cta_secundario']}
                    </span>
                    <span className="block text-xs sm:text-sm text-white/65 mt-0.5">
                      Mi farmacia aún no está dada de alta
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/80 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { v: t['landing.hero_stat1_valor'], l: t['landing.hero_stat1_label'] },
                  { v: t['landing.hero_stat2_valor'], l: t['landing.hero_stat2_label'] },
                  { v: t['landing.hero_stat3_valor'], l: t['landing.hero_stat3_label'] },
                ].map((s, i) => (
                  <div key={i} className="border-l-2 border-brand-500 pl-3">
                    <div className="text-xl font-semibold">{s.v}</div>
                    <div className="text-xs text-white/60">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* HERO VISUAL */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl p-4 sm:p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
                    {heroBraceletUrl ? t['landing.hero_card_titulo'] : 'Vista previa del grabado'}
                  </div>
                  <span className="badge-brand">
                    {heroBraceletUrl ? t['landing.hero_card_badge'] : 'en vivo'}
                  </span>
                </div>
                {heroBraceletUrl ? (
                  <img
                    src={heroBraceletUrl}
                    alt={t['landing.hero_card_titulo']}
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <BraceletPreview color="BLACK" line1="DIABETES TIPO 1" line2="TFNO 666 123 456" />
                )}
                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3 text-xs">
                  <KV k={t['landing.hero_kv1_label']} v={t['landing.hero_kv1_valor']} />
                  <KV k={t['landing.hero_kv2_label']} v={t['landing.hero_kv2_valor']} />
                  <KV k={t['landing.hero_kv3_label']} v={t['landing.hero_kv3_valor']} />
                </div>
              </div>
              {/* Pulsera secundaria decorativa: solo si NO hay foto custom (la foto ya
                  muestra ambas pulseras). */}
              {!heroBraceletUrl && (
                <div className="absolute -bottom-6 -right-6 hidden md:block rotate-3 bg-white rounded-xl p-3 shadow-card border border-ink-100">
                  <BraceletPreview color="RED" line1="EPILEPSIA" line2="" size="sm" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============ CASOS REALES — fotografías del producto en uso ============ */}
        <div id="scroll-casos">
          <RealCasesGallery />
        </div>

        {/* ============ STATS — abrir la mente al farmacéutico ============ */}
        <div id="scroll-stats">
          <AwarenessStats />
        </div>

        {/* ============ PERFILES DE PACIENTE — 8 grupos demográficos ============ */}
        <div id="scroll-personas">
          <PatientPersonas />
        </div>

        {/* ============ GUÍA PARA EL FARMACÉUTICO — cuándo recomendarla ============ */}
        <div id="scroll-guia">
          <PharmacistGuide />
        </div>

        {/* PRODUCTO REAL CON MEDIDAS */}
        <section id="scroll-producto" className="bg-ink-50/40 py-20">
          <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge-brand">El producto</span>
              <h2 className="mt-4 section-title text-3xl">
                {t['producto.titulo']}
              </h2>
              <p className="section-subtitle text-base mb-6">
                {t['producto.descripcion']}
              </p>
              <ul className="space-y-3">
                {[
                  ['Longitud total', '22 cm regulable'],
                  ['Ancho de la correa', '1 cm'],
                  ['Placa de grabado', '4 × 1 cm aluminio'],
                  ['Técnica de marcado', 'Láser permanente · tono antracita'],
                  ['Líneas de grabado', 'Hasta 3 líneas · máx. 19 caracteres por línea'],
                  ['Símbolo médico', 'Estrella de la Vida incluida'],
                  ['Resistencia', 'Apta para uso diario, agua y deporte'],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium text-ink-900">{k}:</span>{' '}
                      <span className="text-ink-600">{v}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* PVP recomendado al paciente */}
              <div className="mt-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-soft">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      {t['pvpr.etiqueta']}
                    </span>
                    <div className="mt-2 text-sm font-semibold text-ink-900">
                      {t['pvpr.titulo']}
                    </div>
                    <p className="mt-1 text-xs text-ink-600 leading-relaxed">
                      {t['pvpr.descripcion']}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-4xl font-semibold text-emerald-700 tracking-tight">
                      {formatEuros(pvprCents)}
                    </div>
                    <div className="text-[11px] text-emerald-700/80">IVA incl. · por pulsera</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden bg-white shadow-card">
                <img
                  src="/api/images/product-main"
                  alt="Pulsera Lomhifar - detalle con medidas"
                  className="w-full h-auto"
                />
              </div>
              <div className="rounded-2xl bg-white shadow-card p-6">
                <div className="text-xs uppercase tracking-wider text-ink-400 mb-3">
                  {t['producto.proporcion_titulo']}
                </div>
                {proporcionUrl ? (
                  <img
                    src={proporcionUrl}
                    alt={t['producto.proporcion_titulo']}
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <BraceletPreview
                    color="BLACK"
                    line1="DIABETES TIPO 1"
                    line2="TFNO 666 123 456"
                    showRuler
                    size="lg"
                    hideMeta
                  />
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-ink-500 flex-wrap gap-2">
                  <span className="badge-muted">
                    {t['producto.proporcion_badge1']}
                  </span>
                  <span>{t['producto.proporcion_badge2']}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CARACTERÍSTICAS DEL CANAL */}
        <section id="scroll-canal" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="badge-brand">{t['canal.badge']}</span>
              <h2 className="mt-4 section-title text-3xl">
                {t['canal.titulo']}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Acceso restringido',
                  desc: 'Solo farmacias autorizadas. Verificación por CIF y código por email.',
                },
                {
                  icon: HeartPulse,
                  title: 'Grabado en vivo',
                  desc: 'Vea el grabado sobre la pulsera mientras escribe. Confirmación expresa antes del carrito.',
                },
                {
                  icon: PackageCheck,
                  title: 'Pedido transparente',
                  desc: 'Cada línea con color, unidades y texto exacto. Recibirá copia del pedido en su email.',
                },
                {
                  icon: Truck,
                  title: 'Envío y plazos claros',
                  desc: 'Portes y plazo de entrega visibles antes de finalizar.',
                },
                {
                  icon: Building2,
                  title: 'Comunicación directa',
                  desc: 'Sin intermediarios. Su pedido llega directamente al equipo de Lomhifar.',
                },
                {
                  icon: Sparkles,
                  title: 'Acabado profesional',
                  desc: 'Pulseras negras o rojas con grabado láser permanente, listas para entregar al paciente.',
                },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-xl border border-ink-100 bg-white hover:border-brand-200 hover:shadow-card transition-all">
                  <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-brand-50 text-brand-700">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-ink-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section id="scroll-cta-final" className="bg-brand-gradient text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-dots-light pointer-events-none" />
          <div className="relative mx-auto max-w-6xl px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold">
                {t['landing.cta_final_titulo']}
              </h2>
              <p className="mt-2 text-white/85 text-sm md:text-base max-w-xl">
                {t['landing.cta_final_descripcion']}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Link href="/acceso" className="btn bg-white text-brand-800 hover:bg-brand-50 w-full sm:w-auto justify-center px-6 py-3 text-base font-semibold shadow-md whitespace-nowrap">
                Acceder
              </Link>
              <Link
                href="/solicitud"
                className="btn bg-transparent text-white border border-white/40 hover:bg-white/10 w-full sm:w-auto justify-center px-6 py-3 text-base whitespace-nowrap"
              >
                Soy nuevo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-ink-100 px-2 py-2.5 sm:p-3 text-center min-w-0">
      <div className="text-ink-500 text-[10px] uppercase tracking-wider truncate">{k}</div>
      <div className="font-semibold text-ink-900 mt-0.5 text-[13px] sm:text-sm break-words leading-tight">{v}</div>
    </div>
  );
}
