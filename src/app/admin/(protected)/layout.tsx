import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { AdminSidebar, AdminMobileTopbar } from '@/components/admin/AdminSidebar';
import { Logo } from '@/components/brand/Logo';

export const metadata = {
  title: 'Administración · Lomhifar',
};

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  // Renderizamos el logo en el server (soporta uploads custom desde /admin/imagenes)
  // y lo pasamos como prop a los componentes cliente.
  const sidebarLogo = <Logo variant="light" showTagline />;
  const mobileLogo = <Logo variant="light" size="sm" />;

  return (
    <div className="min-h-screen flex bg-ink-50/30">
      <AdminSidebar adminEmail={session.email} logo={sidebarLogo} mobileLogo={mobileLogo} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileTopbar adminEmail={session.email} mobileLogo={mobileLogo} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
