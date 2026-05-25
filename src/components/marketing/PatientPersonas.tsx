import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { getAllSiteTexts } from '@/lib/site-texts';
import { getSettings, SETTING_KEYS, parsePersonas } from '@/lib/settings';
import { getAllSiteImageMeta } from '@/lib/site-images';

export async function PatientPersonas() {
  const [t, settings, imageMetas] = await Promise.all([
    getAllSiteTexts(),
    getSettings(),
    getAllSiteImageMeta(),
  ]);

  const personas = parsePersonas(settings[SETTING_KEYS.MARKETING_PERSONAS_JSON]);

  // Mapa: slot → metadata para saber qué personas tienen foto custom
  const photoBySlot = new Map(imageMetas.map((m) => [m.slot, m]));

  return (
    <section className="bg-ink-50/40 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-brand">{t['personas.badge']}</span>
          <h2 className="mt-4 section-title text-3xl">{t['personas.titulo']}</h2>
          <p className="section-subtitle text-base">{t['personas.descripcion']}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {personas.map((p, i) => {
            const slot = `persona-${i + 1}`;
            const meta = photoBySlot.get(slot);
            const hasCustomPhoto = meta?.isCustom && meta?.hasImage;
            const photoUrl = hasCustomPhoto
              ? `/api/images/${slot}?v=${meta!.updatedAt?.getTime() ?? 0}`
              : null;

            return (
              <article
                key={`${p.group}-${i}`}
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
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`Pulsera Lomhifar — ${p.group}`}
                      className="w-full h-auto rounded"
                    />
                  ) : (
                    <BraceletPreview color={p.color} line1={p.line1} line2={p.line2} size="sm" />
                  )}
                </div>

                <p className="text-xs text-ink-600 leading-relaxed mt-auto">{p.why}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
