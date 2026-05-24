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
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
