import { Quote, Pill, Heart, Baby, Footprints, GraduationCap, Activity } from 'lucide-react';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { getAllSiteImageMeta } from '@/lib/site-images';

interface Case {
  slot: string;
  personaName: string;
  age: string;
  location: string;
  scenario: string;
  quote: string;
  color: 'BLACK' | 'RED';
  line1: string;
  line2: string;
  tag: string;
  bgFrom: string;
  bgTo: string;
  halo: string;
  Icon: React.ElementType;
  iconColor: string;
}

const CASES: Case[] = [
  {
    slot: 'case-sofia',
    personaName: 'Sofía',
    age: '8 años',
    location: 'Valencia',
    scenario: 'Asma + alergia a frutos secos',
    quote:
      'En el cole y en las excursiones, los profes saben en segundos qué hacer si me da un ataque o como algo con frutos secos.',
    color: 'RED',
    line1: 'ASMA NUECES',
    line2: 'MAMÁ 666 111 222',
    tag: 'Niños · entorno escolar',
    bgFrom: '#fef3c7',
    bgTo: '#fde68a',
    halo: 'rgba(251, 191, 36, 0.5)',
    Icon: GraduationCap,
    iconColor: 'text-amber-700 bg-amber-100',
  },
  {
    slot: 'case-carmen',
    personaName: 'Carmen',
    age: '42 años',
    location: 'Sevilla',
    scenario: 'Alergia grave a la penicilina',
    quote:
      'Si tengo un accidente, los sanitarios sabrán al instante que no me pueden poner penicilina. Es una tranquilidad enorme.',
    color: 'BLACK',
    line1: 'ALÉRGICA PENIC.',
    line2: 'TFNO 666 987 654',
    tag: 'Alergia medicamentosa',
    bgFrom: '#fce7f4',
    bgTo: '#fbcfe9',
    halo: 'rgba(209, 38, 134, 0.45)',
    Icon: Pill,
    iconColor: 'text-brand-700 bg-brand-100',
  },
  {
    slot: 'case-andres',
    personaName: 'Andrés',
    age: '34 años',
    location: 'Madrid',
    scenario: 'Diabetes tipo 1 · runner',
    quote:
      'Salgo a correr 4 días a la semana. He tenido bajadas. Llevarla puesta es la diferencia entre que sepan qué me pasa o no.',
    color: 'RED',
    line1: 'DIABETES TIPO 1',
    line2: 'INSULINA',
    tag: 'Diabetes · deportista',
    bgFrom: '#dbeafe',
    bgTo: '#bfdbfe',
    halo: 'rgba(59, 130, 246, 0.45)',
    Icon: Footprints,
    iconColor: 'text-sky-700 bg-sky-100',
  },
  {
    slot: 'case-maria',
    personaName: 'María',
    age: '32 años',
    location: 'Bilbao',
    scenario: 'Embarazo de riesgo · 32 semanas',
    quote:
      'Voy sola en metro al trabajo. Si me pasa algo, en mi muñeca saben que estoy embarazada y a quién llamar primero.',
    color: 'RED',
    line1: 'EMBARAZO 32 SEM',
    line2: 'GINEC 666 333 444',
    tag: 'Embarazo · día a día',
    bgFrom: '#fce7f4',
    bgTo: '#f9a8d4',
    halo: 'rgba(236, 72, 153, 0.45)',
    Icon: Baby,
    iconColor: 'text-pink-700 bg-pink-100',
  },
  {
    slot: 'case-pedro',
    personaName: 'Don Pedro',
    age: '78 años',
    location: 'A Coruña',
    scenario: 'Alzheimer fase leve · vive con su hija',
    quote:
      '«El otro día se perdió 2 horas en el barrio. Un vecino vio la pulsera, llamó al teléfono y nos avisó. Ya no salimos sin ella.» — Su hija.',
    color: 'BLACK',
    line1: 'ALZHEIMER',
    line2: 'HIJA 666 555 666',
    tag: 'Tercera edad · Alzheimer',
    bgFrom: '#fef3c7',
    bgTo: '#fcd34d',
    halo: 'rgba(217, 119, 6, 0.45)',
    Icon: Heart,
    iconColor: 'text-amber-800 bg-amber-100',
  },
  {
    slot: 'case-lucia',
    personaName: 'Lucía',
    age: '38 años',
    location: 'Barcelona',
    scenario: 'Anticoagulada (Sintrom) por fibrilación auricular',
    quote:
      'Tomo Sintrom. Antes de cualquier intervención o si me caigo, esta pulsera avisa de que sangro con facilidad.',
    color: 'BLACK',
    line1: 'ANTICOAGULADA',
    line2: 'TFNO 666 111 222',
    tag: 'Anticoagulación · cardio',
    bgFrom: '#fee2e2',
    bgTo: '#fecaca',
    halo: 'rgba(220, 38, 38, 0.45)',
    Icon: Activity,
    iconColor: 'text-rose-700 bg-rose-100',
  },
];

export async function RealCasesGallery() {
  // Consultamos UNA vez todos los slots para saber qué casos tienen foto custom.
  const metas = await getAllSiteImageMeta();
  const metaBySlot = new Map(metas.map((m) => [m.slot, m]));

  return (
    <section className="bg-gradient-to-b from-white via-ink-50/30 to-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-brand">Casos reales</span>
          <h2 className="mt-4 section-title text-3xl">
            Así llevan la pulsera sus pacientes
          </h2>
          <p className="section-subtitle text-base">
            Niños, adultos, embarazadas, mayores. Discreta, elegante y siempre visible
            para los servicios de emergencia. Estas son las situaciones donde marca la
            diferencia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CASES.map((c) => {
            const meta = metaBySlot.get(c.slot);
            const hasCustomPhoto = meta?.isCustom && meta.hasImage;
            const v = meta?.updatedAt ? new Date(meta.updatedAt).getTime() : 'default';

            return (
              <article
                key={c.personaName}
                className="group relative flex flex-col rounded-3xl overflow-hidden border border-ink-100 bg-white shadow-card hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              >
                {/* ============ HERO ============ */}
                {hasCustomPhoto ? (
                  // Foto real subida por el admin → la usamos a sangre
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <img
                      src={`/api/images/${c.slot}?v=${v}`}
                      alt={`${c.personaName} · ${c.scenario}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Tag + icono flotantes */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-800 shadow-sm">
                        {c.tag}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`h-11 w-11 rounded-full ${c.iconColor} shadow-md backdrop-blur flex items-center justify-center ring-1 ring-white/40`}>
                        <c.Icon className="h-5 w-5" />
                      </div>
                    </div>
                    {/* Overlay inferior con persona */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <div className="text-white font-semibold text-lg">{c.personaName}</div>
                        <div className="text-white/75 text-xs">
                          {c.age} · {c.location}
                        </div>
                      </div>
                      <div className="text-white/90 text-sm mt-0.5">{c.scenario}</div>
                    </div>
                  </div>
                ) : (
                  // Sin foto → tarjeta atmosférica con la pulsera real
                  <div
                    className="relative aspect-[5/4] overflow-hidden flex items-center justify-center px-6"
                    style={{
                      background: `linear-gradient(155deg, ${c.bgFrom} 0%, ${c.bgTo} 100%)`,
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse 70% 60% at 70% 30%, ${c.halo} 0%, transparent 60%)`,
                      }}
                    />
                    <div
                      className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 70%)`,
                      }}
                    />
                    <div
                      className="absolute inset-0 opacity-30 pointer-events-none"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
                        backgroundSize: '20px 20px',
                      }}
                    />
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-800 shadow-sm">
                        {c.tag}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`h-11 w-11 rounded-full ${c.iconColor} shadow-md backdrop-blur flex items-center justify-center ring-1 ring-white/40`}>
                        <c.Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div
                      className="relative z-[5] w-full transform group-hover:scale-105 transition-transform duration-500"
                      style={{ filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.25))' }}
                    >
                      <div className="rotate-[-6deg]">
                        <BraceletPreview color={c.color} line1={c.line1} line2={c.line2} size="md" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ============ INFO ============ */}
                <div className="p-6 flex-1 flex flex-col">
                  {!hasCustomPhoto && (
                    <header className="mb-4">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-ink-900">{c.personaName}</h3>
                        <span className="text-xs text-ink-500">
                          · {c.age} · {c.location}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-medium text-brand-800">
                        {c.scenario}
                      </div>
                    </header>
                  )}

                  <div className="relative pl-8 mt-auto">
                    <Quote className="absolute top-0 left-0 h-5 w-5 text-brand-300" />
                    <p className="text-sm text-ink-700 italic leading-relaxed">{c.quote}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-12 text-center text-xs text-ink-400 italic max-w-2xl mx-auto">
          Las situaciones están inspiradas en patrones reales de prescripción y atención
          farmacéutica en España. Personajes ilustrativos. Para sustituir cualquier
          ilustración por una foto real, súbela desde el panel admin → Imágenes del sitio.
        </p>
      </div>
    </section>
  );
}
