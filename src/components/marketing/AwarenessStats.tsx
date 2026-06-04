import { Users, Heart, Activity, Droplet } from 'lucide-react';
import { getAllSiteTexts } from '@/lib/site-texts';

const STATS = [
  {
    icon: Droplet,
    figure: '5,1 M',
    label: 'personas con diabetes en España',
    detail: '14% de la población adulta · 1 de cada 7',
  },
  {
    icon: Heart,
    figure: '900 K',
    label: 'personas anticoaguladas',
    detail: 'Sintrom o nuevos anticoagulantes orales',
  },
  {
    icon: Activity,
    figure: '800 K',
    label: 'personas con epilepsia',
    detail: 'En España, 25.000 nuevos casos cada año',
  },
  {
    icon: Users,
    figure: '900 K',
    label: 'personas con Alzheimer',
    detail: '70% de los casos de demencia en mayores',
  },
];

export async function AwarenessStats() {
  const t = await getAllSiteTexts();
  return (
    <section className="bg-ink-gradient text-white py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots-light opacity-50 pointer-events-none" />
      <div
        className="hidden sm:block absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(209,38,134,0.25) 0%, rgba(209,38,134,0) 70%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-brand-100 backdrop-blur">
            {t['stats.badge']}
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            {t['stats.titulo_1']}
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-white bg-clip-text text-transparent">
              {t['stats.titulo_2']}
            </span>
          </h2>
          <p className="mt-3 text-white/70 max-w-xl mx-auto leading-relaxed">
            {t['stats.descripcion']}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur hover:bg-white/[0.07] transition-colors"
            >
              <s.icon className="h-5 w-5 text-brand-300 mb-4" />
              <div className="text-4xl font-semibold tracking-tight text-white">
                {s.figure}
              </div>
              <div className="mt-2 text-sm text-white/85">{s.label}</div>
              <div className="mt-1 text-xs text-white/50">{s.detail}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-xs text-white/40">
          {t['stats.fuentes']}
        </div>
      </div>
    </section>
  );
}
