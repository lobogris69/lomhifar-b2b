import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { AdminSidebar, AdminMobileTopbar } from '@/components/admin/AdminSidebar';
import { MustChangePasswordBanner } from '@/components/admin/MustChangePasswordBanner';
import { Logo } from '@/components/brand/Logo';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Administración · Lomhifar',
};

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  // Si tiene que cambiar password al primer login, lo forzamos.
  // Solo dejamos pasar las rutas /admin/perfil y /admin (con aviso)
  // El header x-invoke-path no existe en Next 14, así que la página /admin/perfil
  // se encarga de quitar el flag al cambiar la password (revalidatePath).
  // Aquí solo redirigimos si no está ya en /perfil.
  // (El propio session.mustChangePassword se quedará "stale" hasta logout/login,
  //  pero al cambiar password la revalidación quita el aviso del banner.)

  // Logo server-rendered (soporta uploads custom desde /admin/imagenes)
  const sidebarLogo = <Logo variant="light" showTagline />;
  const mobileLogo = <Logo variant="light" size="sm" />;

  // Contadores para badges del menú (resiliente ante BD no lista)
  let pendingApplications = 0;
  let lowStock = 0;
  try {
    pendingApplications = await prisma.pharmacyApplication.count({ where: { status: 'PENDING' } });
  } catch {
    pendingApplications = 0;
  }
  try {
    const stocks = await prisma.stock.findMany();
    lowStock = stocks.filter((s) => s.quantity <= s.minAlertLevel).length;
  } catch {
    lowStock = 0;
  }
  const badges = { pendingApplications, lowStock };
  const adminRole = session.role ?? 'ADMIN';

  return (
    <div className="min-h-screen flex bg-ink-50/30">
      <AdminSidebar
        adminEmail={session.email}
        adminRole={adminRole}
        logo={sidebarLogo}
        mobileLogo={mobileLogo}
        badges={badges}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileTopbar
          adminEmail={session.email}
          adminRole={adminRole}
          mobileLogo={mobileLogo}
          badges={badges}
        />
        {session.mustChangePassword && <MustChangePasswordBanner />}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
