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

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-ink-gradient text-white">
          <div className="absolute inset-0 bg-dots-light pointer-events-none" />
          <div
            className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(209,38,134,0.35) 0%, rgba(209,38,134,0) 70%)',
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-100 backdrop-blur border border-white/10">
                <ShieldCheck className="h-3.5 w-3.5" />
                Plataforma privada · Acceso solo farmacias
              </span>
              <h1 className="mt-6 text-4xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.05]">
                Pulseras sanitarias
                <br />
                <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-white bg-clip-text text-transparent">
                  personalizadas
                </span>
                <br />
                para su farmacia.
              </h1>
              <p className="mt-6 text-lg text-white/80 max-w-xl leading-relaxed">
                Lomhifar pone a disposición del canal farmacia un sistema profesional
                para pedir pulseras de identificación médica con grabado láser, listas
                para entregar al paciente. Negras o rojas, dos líneas de grabado a láser
                sobre placa de aluminio de 4 × 1 cm.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/acceso"
                  className="btn-primary bg-white text-ink-900 hover:bg-brand-50 hover:text-brand-800 px-6 py-3 text-base shadow-glow"
                >
                  Acceder con CIF y email <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/solicitud"
                  className="btn-secondary bg-transparent text-white border-white/30 hover:bg-white/10 px-6 py-3 text-base"
                >
                  Solicitar alta de farmacia
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { v: '22 × 1', l: 'cm pulsera' },
                  { v: '4 × 1', l: 'cm placa aluminio' },
                  { v: '7 días', l: 'plazo entrega' },
                ].map((s) => (
                  <div key={s.l} className="border-l-2 border-brand-500 pl-3">
                    <div className="text-xl font-semibold">{s.v}</div>
                    <div className="text-xs text-white/60">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* HERO VISUAL */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
                    Vista previa del grabado
                  </div>
                  <span className="badge-brand">en vivo</span>
                </div>
                <BraceletPreview color="BLACK" line1="DIABETES TIPO 1" line2="TFNO 666 123 456" />
                <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
                  <KV k="Color" v="Negra" />
                  <KV k="Unidades" v="25" />
                  <KV k="Total" v="87,50 €" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 hidden md:block rotate-3 bg-white rounded-xl p-3 shadow-card border border-ink-100">
                <BraceletPreview color="RED" line1="EPILEPSIA" line2="" size="sm" />
              </div>
            </div>
          </div>
        </section>

        {/* ============ CASOS REALES — fotografías del producto en uso ============ */}
        <RealCasesGallery />

        {/* ============ STATS — abrir la mente al farmacéutico ============ */}
        <AwarenessStats />

        {/* ============ PERFILES DE PACIENTE — 8 grupos demográficos ============ */}
        <PatientPersonas />

        {/* ============ GUÍA PARA EL FARMACÉUTICO — cuándo recomendarla ============ */}
        <PharmacistGuide />

        {/* PRODUCTO REAL CON MEDIDAS */}
        <section className="bg-ink-50/40 py-20">
          <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge-brand">El producto</span>
              <h2 className="mt-4 section-title text-3xl">
                Pulsera de silicona médica con placa de aluminio grabada a láser
              </h2>
              <p className="section-subtitle text-base mb-6">
                Silicona hipoalergénica de grado médico, cierre regulable, placa central
                de aluminio con grabado láser permanente en tono antracita.
              </p>
              <ul className="space-y-3">
                {[
                  ['Longitud total', '22 cm regulable'],
                  ['Ancho de la correa', '1 cm'],
                  ['Placa de grabado', '4 × 1 cm aluminio'],
                  ['Técnica de marcado', 'Láser permanente · tono antracita'],
                  ['Líneas de grabado', '2 (máx. 14 caracteres por línea)'],
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
                  Proporción real
                </div>
                <BraceletPreview
                  color="BLACK"
                  line1="DIABETES TIPO 1"
                  line2="TFNO 666 123 456"
                  showRuler
                  size="lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CARACTERÍSTICAS DEL CANAL */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="badge-brand">Canal profesional</span>
              <h2 className="mt-4 section-title text-3xl">
                Diseñado por y para la oficina de farmacia
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
        <section className="bg-brand-gradient text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-dots-light pointer-events-none" />
          <div className="relative mx-auto max-w-6xl px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold">
                ¿Su farmacia trabaja ya con Lomhifar?
              </h2>
              <p className="mt-2 text-white/85 text-sm md:text-base max-w-xl">
                Acceda con su CIF y el email registrado. Si aún no es cliente, solicite
                el alta y nuestro equipo validará su farmacia en horas hábiles.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/acceso" className="btn bg-white text-brand-800 hover:bg-brand-50 px-6 py-3 text-base font-semibold shadow-md">
                Acceder
              </Link>
              <Link
                href="/solicitud"
                className="btn bg-transparent text-white border border-white/40 hover:bg-white/10 px-6 py-3 text-base"
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
    <div className="rounded-lg border border-ink-100 p-3">
      <div className="text-ink-500 text-[10px] uppercase tracking-wider">{k}</div>
      <div className="font-semibold text-ink-900 mt-0.5">{v}</div>
    </div>
  );
}
