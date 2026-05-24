import Link from 'next/link';
import { Lock } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { BrandLockup } from '@/components/brand/BrandMark';
import { Alert } from '@/components/ui/Alert';
import { CompleteResetForm } from './CompleteForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nueva contraseña · Admin Lomhifar' };

export default async function CompleteResetPage({ params }: { params: { token: string } }) {
  // Validamos el token antes de mostrar el formulario
  const row = await prisma.adminPasswordReset.findUnique({
    where: { token: params.token },
    include: { admin: { select: { email: true } } },
  });

  const invalid = !row || row.usedAt || row.expiresAt < new Date();

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-white">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <BrandLockup variant="light" size="md" />
          </div>
          <div className="bg-white text-ink-900 rounded-2xl shadow-soft p-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-semibold text-ink-900">Crear nueva contraseña</h1>
                {row && <p className="text-xs text-ink-500">{row.admin.email}</p>}
              </div>
            </div>

            {invalid ? (
              <Alert variant="danger" title="Enlace no válido o caducado">
                Este enlace ha expirado o ya se ha usado. Solicita uno nuevo.
                <div className="mt-3">
                  <Link href="/admin/recuperar" className="btn-primary">
                    Solicitar nuevo enlace
                  </Link>
                </div>
              </Alert>
            ) : (
              <CompleteResetForm token={params.token} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
