import { BraceletPreview } from '@/components/shop/BraceletPreview';

interface Persona {
  emoji: string;
  group: string;
  context: string;
  color: 'BLACK' | 'RED';
  line1: string;
  line2: string;
  why: string;
  ageRange: string;
}

const PERSONAS: Persona[] = [
  {
    emoji: '🧒',
    group: 'Niños',
    ageRange: '4 - 12 años',
    context: 'Asma, alergias graves, epilepsia infantil',
    color: 'RED',
    line1: 'ASMA · EPILEPSIA',
    line2: 'MAMÁ 666 111 222',
    why: 'En el cole, parque o excursiones — si no están con sus padres, la pulsera habla por ellos.',
  },
  {
    emoji: '🧑‍🎓',
    group: 'Adolescentes',
    ageRange: '13 - 18 años',
    context: 'Diabetes, alergia a frutos secos',
    color: 'BLACK',
    line1: 'ALÉRGICO NUECES',
    line2: 'EPIPEN · 666 222 333',
    why: 'Salidas con amigos, viajes, deporte. Más vergonzoso explicar la patología que llevarla bien grabada.',
  },
  {
    emoji: '🤰',
    group: 'Embarazadas',
    ageRange: '18 - 45 años',
    context: 'Embarazo de riesgo, RH negativo, gestacional',
    color: 'RED',
    line1: 'EMBARAZO 32 SEM',
    line2: 'GINEC 666 333 444',
    why: 'Información crítica en urgencias. En caso de accidente, el equipo médico sabe que hay dos vidas.',
  },
  {
    emoji: '🏃',
    group: 'Deportistas',
    ageRange: '20 - 60 años',
    context: 'Asma de esfuerzo, cardiopatía, diabetes',
    color: 'BLACK',
    line1: 'CARDIO · ASMA',
    line2: 'TFNO 666 444 555',
    why: 'Running, ciclismo, montaña. Lejos del coche y los papeles, la muñeca es donde miran los sanitarios.',
  },
  {
    emoji: '👨',
    group: 'Adultos',
    ageRange: '30 - 65 años',
    context: 'Diabetes, hipertensión, anticoagulación',
    color: 'RED',
    line1: 'DIABETES TIPO 2',
    line2: 'METFORMINA',
    why: 'Vida laboral activa. Ante un mareo o accidente, sus compañeros y los servicios saben qué hacer.',
  },
  {
    emoji: '👩‍⚕️',
    group: 'Patologías raras',
    ageRange: 'Toda edad',
    context: 'Porfiria, Addison, hemofilia',
    color: 'BLACK',
    line1: 'PORFIRIA',
    line2: 'NO BARBITÚR.',
    why: 'Las enfermedades minoritarias no las conoce todo el personal sanitario. Su pulsera evita errores.',
  },
  {
    emoji: '👵',
    group: 'Mayores',
    ageRange: '65+ años',
    context: 'Alzheimer, demencia, marcapasos',
    color: 'RED',
    line1: 'ALZHEIMER',
    line2: 'TFNO 666 555 666',
    why: 'Pueden desorientarse y alejarse de casa. La pulsera permite que cualquiera contacte con la familia.',
  },
  {
    emoji: '♿',
    group: 'Discapacidad',
    ageRange: 'Toda edad',
    context: 'Autismo, sordomudez, parálisis cerebral',
    color: 'BLACK',
    line1: 'TEA · NO HABLA',
    line2: 'TUTOR 666 666 777',
    why: 'Personas que no pueden comunicar verbalmente sus necesidades médicas. La pulsera lo hace por ellas.',
  },
];

export function PatientPersonas() {
  return (
    <section className="bg-ink-50/40 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-brand">Para todos los pacientes</span>
          <h2 className="mt-4 section-title text-3xl">
            Hay un paciente para cada pulsera en su farmacia
          </h2>
          <p className="section-subtitle text-base">
            No es solo para mayores. Niños, adolescentes, embarazadas, deportistas,
            personas con patologías crónicas o raras. Abrámoles los ojos.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERSONAS.map((p) => (
            <article
              key={p.group}
              className="card p-5 flex flex-col hover:shadow-soft hover:-translate-y-0.5 transition-all"
            >
              <header className="flex items-center gap-3 mb-3">
                <span className="text-3xl" aria-hidden>
                  {p.emoji}
                </span>
                <div>
                  <div className="font-semibold text-ink-900 text-sm">{p.group}</div>
                  <div className="text-[11px] text-ink-500">{p.ageRange}</div>
                </div>
              </header>
              <div className="text-xs text-ink-600 mb-3 min-h-[2.5rem]">{p.context}</div>

              <div className="bg-ink-50/60 rounded-lg p-2 mb-3">
                <BraceletPreview color={p.color} line1={p.line1} line2={p.line2} size="sm" />
              </div>

              <p className="text-xs text-ink-600 leading-relaxed mt-auto">{p.why}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
