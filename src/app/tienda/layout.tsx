import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';
import { readCart } from '@/lib/cart';
import { ShopHeader } from '@/components/shop/ShopHeader';
import { PublicFooter } from '@/components/marketing/PublicHeader';
import { Logo } from '@/components/brand/Logo';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();
  if (!session) redirect('/acceso');
  const cart = readCart();
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);
  const logo = <Logo />;

  return (
    <div className="flex min-h-screen flex-col bg-ink-50/40">
      <ShopHeader
        pharmacyName={session.customer.pharmacyName}
        cartCount={cartCount}
        logo={logo}
      />
      {/* Con la farmacia de prueba la tienda es identica a la de verdad, y
          eso es justo lo que se quiere probar. Pero conviene no olvidarse de
          en que sesion se esta: los pedidos que salgan de aqui son de mentira
          y se borraran. */}
      {session.customer.isTest && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          Farmacia de prueba · los pedidos que hagas aquí no cuentan en las
          estadísticas y se borran desde Sistema
        </div>
      )}
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
