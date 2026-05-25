import { PublicHeader, PublicFooter } from '@/components/marketing/PublicHeader';
import { HashHighlight } from '@/components/HashHighlight';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <HashHighlight />
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
