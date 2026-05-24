import { Building2 } from 'lucide-react';
import { ApplicationForm } from './ApplicationForm';
import { getAllSiteTexts } from '@/lib/site-texts';

// Consulta la BD para los textos editables → render dinámico
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Solicitud de alta · Lomhifar' };

export default async function SolicitudPage({
  searchParams,
}: {
  searchParams: { cif?: string; email?: string };
}) {
  const t = await getAllSiteTexts();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 mb-3">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="section-title">{t['solicitud.titulo']}</h1>
        <p className="section-subtitle">{t['solicitud.descripcion']}</p>
      </div>

      <div className="card p-6 lg:p-10">
        <ApplicationForm
          initialCif={searchParams.cif}
          initialEmail={searchParams.email}
          submitLabel={t['solicitud.cta']}
        />
      </div>
    </div>
  );
}
