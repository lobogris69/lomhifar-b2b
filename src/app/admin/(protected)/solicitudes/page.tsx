import { Building2, Check, X } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { approveApplication, rejectApplication } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Solicitudes · Admin Lomhifar' };

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (searchParams.status as 'PENDING' | 'APPROVED' | 'REJECTED') ?? 'PENDING';

  const apps = await prisma.pharmacyApplication.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <h1 className="section-title flex items-center gap-2">
          <Building2 className="h-6 w-6 text-brand-700" />
          Solicitudes de alta
        </h1>
        <p className="section-subtitle">Aprobaciones manuales de nuevas farmacias.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <Tab href="/admin/solicitudes?status=PENDING" active={status === 'PENDING'}>Pendientes</Tab>
        <Tab href="/admin/solicitudes?status=APPROVED" active={status === 'APPROVED'}>Aprobadas</Tab>
        <Tab href="/admin/solicitudes?status=REJECTED" active={status === 'REJECTED'}>Rechazadas</Tab>
      </div>

      {apps.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">No hay solicitudes en este estado.</div>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => (
            <div key={a.id} className="card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <h3 className="font-semibold text-ink-900 text-lg">{a.pharmacyName}</h3>
                  <p className="text-sm text-ink-500">
                    CIF <span className="font-mono">{a.cif}</span> · {a.contactName} · {a.email} · {a.phone}
                  </p>
                  <p className="text-sm text-ink-700">
                    {a.address}, {a.city} ({a.postalCode}) · {a.province}
                  </p>
                  <p className="text-sm text-ink-700 mt-1">
                    <span className="text-ink-400 text-xs uppercase tracking-wider mr-2">IBAN</span>
                    <span className="font-mono">{a.bankAccount}</span>
                    {a.whatsapp && (
                      <>
                        <span className="text-ink-400 text-xs uppercase tracking-wider ml-4 mr-2">WhatsApp</span>
                        <span>{a.whatsapp}</span>
                      </>
                    )}
                  </p>
                  {a.message && (
                    <p className="mt-2 text-sm bg-ink-50 border-l-2 border-brand-500 p-3 rounded">
                      {a.message}
                    </p>
                  )}
                  <p className="text-xs text-ink-400 mt-1">
                    Recibida el {formatDate(a.createdAt)}
                    {a.reviewedAt && <> · Revisada el {formatDate(a.reviewedAt)}</>}
                  </p>
                </div>
                {status === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <form action={approveApplication}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="btn-primary">
                        <Check className="h-4 w-4" /> Aprobar
                      </button>
                    </form>
                    <details className="relative">
                      <summary className="btn-secondary cursor-pointer list-none">
                        <X className="h-4 w-4" /> Rechazar
                      </summary>
                      <form
                        action={rejectApplication}
                        className="absolute right-0 mt-2 w-80 card p-4 z-10 space-y-2"
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <label className="label">Motivo (opcional, se envía por email)</label>
                        <textarea name="notes" rows={3} className="input" />
                        <button type="submit" className="btn-danger w-full">
                          Confirmar rechazo
                        </button>
                      </form>
                    </details>
                  </div>
                )}
                {status === 'REJECTED' && a.reviewedNotes && (
                  <p className="text-sm text-danger max-w-md">Motivo: {a.reviewedNotes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium ${
        active ? 'bg-brand-700 text-white' : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'
      }`}
    >
      {children}
    </a>
  );
}
