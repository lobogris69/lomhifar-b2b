import Link from 'next/link';
import { ShieldCheck, Building2, Lock, HeartPulse, Sparkles, Mail } from 'lucide-react';
import { AccessForm } from './AccessForm';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';
import { BrandLockup } from '@/components/brand/BrandMark';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import { getAllSiteTexts } from '@/lib/site-texts';
import { getSiteImageMeta } from '@/lib/site-images';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Acceso farmacia · Lomhifar' };

export default async function AccessPage() {
  const session = await getCustomerSession();
  if (session) redirect('/tienda');

  // Textos editables desde /admin/textos
  const [t, bracelectImg] = await Promise.all([
    getAllSiteTexts(),
    getSiteImageMeta('acceso-bracelet'),
  ]);
  const demoColor = (t['acceso.demo_color'] === 'RED' ? 'RED' : 'BLACK') as 'BLACK' | 'RED';
  const hasCustomBracelet = bracelectImg.isCustom && bracelectImg.hasImage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/50 flex flex-col">
      {/* Header mínimo */}
      <header className="px-6 py-5 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <BrandLockup size="md" />
        </Link>
        <Link href="/" className="text-xs text-ink-500 hover:text-ink-800">
          ← Volver al inicio
        </Link>
      </header>

      {/* Main: 2 columnas en desktop, 1 columna en móvil */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 lg:py-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">

          {/* Columna izquierda: contexto visual (qué es esta página) */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 border border-brand-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-800">
                <Building2 className="h-3 w-3" />
                {t['acceso.badge']}
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] text-ink-900">
                {t['acceso.titulo_principal']}
                <br />
                <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                  {t['acceso.titulo_destacado']}
                </span>
              </h1>
              <p className="mt-4 text-base text-ink-600 leading-relaxed max-w-lg">
                {t['acceso.descripcion']}
              </p>
            </div>

            {/* Visual del producto */}
            <div className="bg-white rounded-2xl border border-ink-100 shadow-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-wider text-ink-500">
                  El producto
                </div>
                <span className="badge-brand text-[10px]">Grabado láser</span>
              </div>
              {hasCustomBracelet ? (
                /* Foto real subida desde /admin/imagenes (slot: acceso-bracelet) */
                <img
                  src="/api/images/acceso-bracelet"
                  alt="Pulsera Lomhifar — grabado láser"
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <BraceletPreview
                  color={demoColor}
                  line1={t['acceso.demo_linea1']}
                  line2={t['acceso.demo_linea2']}
                  size="md"
                />
              )}
            </div>

            {/* 3 features compactas */}
            <ul className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Sparkles, t: t['acceso.feature_1_titulo'], d: t['acceso.feature_1_desc'] },
                { icon: HeartPulse, t: t['acceso.feature_2_titulo'], d: t['acceso.feature_2_desc'] },
                { icon: ShieldCheck, t: t['acceso.feature_3_titulo'], d: t['acceso.feature_3_desc'] },
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/60 border border-ink-100">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 shrink-0">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-ink-900">{f.t}</div>
                    <div className="text-[11px] text-ink-500">{f.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna derecha: formulario login */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-soft border border-ink-100 overflow-hidden">
              {/* Cabecera del card */}
              <div className="bg-brand-gradient text-white px-7 py-6 text-center">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur mb-2">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold">{t['acceso.form_titulo']}</h2>
                <p className="mt-1 text-xs text-white/85">
                  {t['acceso.form_subtitulo']}
                </p>
              </div>

              {/* Cuerpo del card */}
              <div className="p-6 sm:p-7">
                <AccessForm />
              </div>

              {/* Pie del card: pistas confidencialidad */}
              <div className="px-7 py-3 bg-ink-50/40 border-t border-ink-100">
                <div className="flex items-center justify-center gap-2 text-[11px] text-ink-500">
                  <Mail className="h-3 w-3 text-brand-600" />
                  <span>Código de un solo uso al email registrado</span>
                </div>
              </div>
            </div>

            {/* Enlace admin discreto */}
            <div className="mt-5 text-center">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 transition-colors"
              >
                <Lock className="h-3 w-3" />
                ¿Eres administrador de Lomhifar?
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="px-6 py-4 text-center text-[11px] text-ink-400 border-t border-ink-100 bg-white/40">
        © {new Date().getFullYear()} <strong>Lomhifar</strong> · Pulseras de identificación sanitaria · Canal exclusivo farmacia
      </footer>
    </div>
  );
}
