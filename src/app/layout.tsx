import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const engrave = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-engrave',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lomhifar · Pedidos profesionales para farmacia',
  description:
    'Plataforma B2B exclusiva para farmacias autorizadas. Pulseras de identificación sanitaria personalizadas Lomhifar.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${engrave.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
