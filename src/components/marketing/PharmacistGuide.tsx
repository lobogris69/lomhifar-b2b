import { CheckCircle2 } from 'lucide-react';

interface Trigger {
  category: string;
  cases: string[];
  color: string;
}

const TRIGGERS: Trigger[] = [
  {
    category: 'Patologías crónicas',
    color: 'bg-rose-50 text-rose-800 border-rose-200',
    cases: [
      'Diabéticos que recogen insulina o tiras reactivas',
      'Pacientes con Sintrom o anticoagulantes orales',
      'Hipertensos en tratamiento de larga duración',
      'Pacientes con EPOC o asma grave',
      'Cardiópatas con marcapasos o stent',
    ],
  },
  {
    category: 'Alergias y reacciones',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    cases: [
      'Alérgicos a antibióticos (penicilina, sulfamidas)',
      'Alergia al látex',
      'Anafilaxia conocida (frutos secos, mariscos)',
      'Portadores de adrenalina autoinyectable',
      'Alergia a contrastes radiológicos',
    ],
  },
  {
    category: 'Personas mayores',
    color: 'bg-sky-50 text-sky-800 border-sky-200',
    cases: [
      'Diagnóstico de Alzheimer o deterioro cognitivo',
      'Demencia leve que aún sale sola a la calle',
      'Mayores que viven solos',
      'Cuidadores que piden ayuda para el familiar',
      'Vecinos mayores frecuentes de la farmacia',
    ],
  },
  {
    category: 'Niños y adolescentes',
    color: 'bg-violet-50 text-violet-800 border-violet-200',
    cases: [
      'Padres recogiendo broncodilatadores (asma infantil)',
      'Niños con epilepsia o convulsiones febriles',
      'Diabetes tipo 1 en edad escolar',
      'Alergias alimentarias graves',
      'Trastornos del espectro autista o discapacidad',
    ],
  },
  {
    category: 'Situaciones especiales',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cases: [
      'Embarazos de riesgo o con patología asociada',
      'Pacientes oncológicos en tratamiento',
      'Trasplantados (inmunosupresores)',
      'Donantes de órganos vivos',
      'Hemofilia y trastornos de coagulación',
    ],
  },
  {
    category: 'Estilo de vida',
    color: 'bg-orange-50 text-orange-800 border-orange-200',
    cases: [
      'Deportistas: runners, ciclistas, senderistas',
      'Profesionales con riesgo (obra, transporte)',
      'Personas que viajan a menudo solas',
      'Tercera edad activa que sale del barrio',
      'Niños que van al campamento o excursiones',
    ],
  },
];

export function PharmacistGuide() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-brand">Para el farmacéutico</span>
          <h2 className="mt-4 section-title text-3xl">
            ¿Cuándo recomendarla? Una guía rápida
          </h2>
          <p className="section-subtitle text-base">
            En su día a día atendiendo el mostrador, estas son las señales para sugerir
            naturalmente la pulsera a su cliente. Aproveche cada conversación.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TRIGGERS.map((t) => (
            <div
              key={t.category}
              className="card p-6 hover:shadow-soft transition-shadow flex flex-col"
            >
              <div className={`inline-flex self-start items-center rounded-full border px-3 py-1 text-xs font-semibold ${t.color} mb-4`}>
                {t.category}
              </div>
              <ul className="space-y-2.5 flex-1">
                {t.cases.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-700 leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tip final */}
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-brand-50 border border-brand-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
          <div className="text-4xl shrink-0" aria-hidden>💡</div>
          <div>
            <h3 className="font-semibold text-ink-900 text-lg">
              La frase mágica del mostrador
            </h3>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">
              <em>«Por cierto, ¿sabe que tenemos pulseras de identificación sanitaria personalizadas?
              Si tiene un accidente o un mareo, los sanitarios sabrán al momento que es{' '}
              <strong>diabético / alérgico a la penicilina / anticoagulado</strong>. Cuesta poco
              y se la grabamos con sus datos.»</em>
            </p>
            <p className="mt-3 text-xs text-ink-500">
              Sugerirla cuando dispensa la medicación habitual es el momento perfecto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
