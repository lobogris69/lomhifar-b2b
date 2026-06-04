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

// Forzamos light mode SIEMPRE — la app está diseñada con fondos blancos
// (fotos de pulseras, fidelidad del grabado láser, emails y PDFs blancos).
// Esto le dice al navegador (Samsung Internet, Chrome Android, etc.) que NO
// aplique su modo oscuro forzado, que rompía contrastes en /tienda y /acceso.
export const viewport = {
  colorScheme: 'light' as const,
  themeColor: '#ffffff',
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
