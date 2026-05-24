import { UserCog, Lock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { ChangePasswordForm, ChangeProfileForm } from './ProfileForms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi perfil · Admin Lomhifar' };

export default async function ProfilePage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { email: true, name: true },
  });
  if (!admin) redirect('/admin/login');

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <UserCog className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Mi perfil</h1>
          <p className="section-subtitle">Gestiona tu cuenta de administrador.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink-900 mb-4">Datos personales</h2>
          <ChangeProfileForm defaultName={admin.name ?? ''} email={admin.email} />
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-brand-700" />
            <h2 className="text-sm font-semibold text-ink-900">Cambiar contraseña</h2>
          </div>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
