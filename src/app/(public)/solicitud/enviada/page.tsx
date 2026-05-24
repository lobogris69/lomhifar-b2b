import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getAllSiteTexts } from '@/lib/site-texts';

// El layout público renderiza el Logo (consulta BD) → render dinámico
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Solicitud enviada · Lomhifar' };

export default async function SentPage() {
  const t = await getAllSiteTexts();
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 mb-4">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="section-title">{t['solicitud_ok.titulo']}</h1>
      <p className="section-subtitle">{t['solicitud_ok.descripcion']}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-secondary">
          Volver al inicio
        </Link>
        <Link href="/acceso" className="btn-primary">
          Ya soy cliente
        </Link>
      </div>
    </div>
  );
}
