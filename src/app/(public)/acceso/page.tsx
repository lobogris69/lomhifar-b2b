import Link from 'next/link';
import { ShieldCheck, Building2, Lock, ArrowRight } from 'lucide-react';
import { AccessForm } from './AccessForm';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';
import { BrandLockup } from '@/components/brand/BrandMark';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Acceso farmacia · Lomhifar' };

export default async function AccessPage() {
  const session = await getCustomerSession();
  if (session) redirect('/tienda');

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/50 flex flex-col">
      {/* Header mínimo */}
      <header className="px-6 py-5 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <BrandLockup size="md" />
        </Link>
        <Link href="/" className="text-xs text-ink-500 hover:text-ink-800">
          ← Volver al inicio
        </Link>
      </header>

      {/* Centro principal — form único centrado */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Card del formulario */}
          <div className="bg-white rounded-2xl shadow-soft border border-ink-100 overflow-hidden">

            {/* Cabecera del card */}
            <div className="bg-brand-gradient text-white px-8 py-7 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold">Acceso para farmacias</h1>
              <p className="mt-1 text-sm text-white/85">
                Solo farmacias autorizadas
              </p>
            </div>

            {/* Cuerpo del card */}
            <div className="p-7 sm:p-8">
              <AccessForm />
            </div>

            {/* Pie del card: pistas confidencialidad */}
            <div className="px-7 py-4 bg-ink-50/40 border-t border-ink-100">
              <div className="flex items-center justify-center gap-2 text-[11px] text-ink-500">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                <span>Conexión segura · Código de un solo uso al email</span>
              </div>
            </div>
          </div>

          {/* Enlaces secundarios */}
          <div className="mt-6 text-center space-y-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 transition-colors"
            >
              <Lock className="h-3 w-3" />
              ¿Eres administrador de Lomhifar?
            </Link>
          </div>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="px-6 py-4 text-center text-[11px] text-ink-400">
        © {new Date().getFullYear()} Lomhifar · Canal exclusivo farmacia
      </footer>
    </div>
  );
}
