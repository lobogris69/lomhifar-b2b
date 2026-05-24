import { redirect } from 'next/navigation';
import { ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import { getAdminSession } from '@/lib/auth';
import { BrandLockup, BrandMark } from '@/components/brand/BrandMark';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Acceso administrador · Lomhifar' };

export default async function AdminLoginPage() {
  const s = await getAdminSession();
  if (s) redirect('/admin');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ink-950 text-white overflow-hidden">
      {/* ============ Panel izquierdo — marca + composición visual ============ */}
      <aside className="relative flex-1 lg:w-3/5 flex flex-col justify-between p-8 lg:p-14 overflow-hidden">
        {/* Capa de gradiente con halo magenta */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 25% 30%, rgba(209,38,134,0.30) 0%, rgba(146,26,94,0.12) 35%, rgba(0,0,0,0) 70%)',
          }}
        />
        {/* Patrón de puntos sutil estilo logo */}
        <div className="absolute inset-0 bg-dots-light opacity-60 pointer-events-none" />
        {/* Mark gigante decorativo de fondo (atrás del contenido) */}
        <div className="absolute -bottom-20 -right-20 lg:-right-32 pointer-events-none">
          <BrandMark
            className="w-[420px] h-[420px] lg:w-[640px] lg:h-[640px] opacity-[0.06]"
            primary="#ffffff"
            secondary="#ffffff"
          />
        </div>

        {/* Cabecera con lockup */}
        <header className="relative">
          <BrandLockup variant="light" size="md" animated />
        </header>

        {/* Centro: claim */}
        <div className="relative max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 backdrop-blur px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-brand-100">
            <ShieldCheck className="h-3.5 w-3.5" /> Panel privado de administración
          </div>
          <h1 className="mt-6 text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
            Gestione su canal
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-white bg-clip-text text-transparent">
              farmacia
            </span>{' '}
            con precisión.
          </h1>
          <p className="mt-5 text-white/70 max-w-md leading-relaxed">
            Clientes, solicitudes de alta, pedidos en curso, configuración de precios,
            portes y plazos. Todo en un único panel diseñado para Lomhifar.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: Sparkles, t: 'Configuración global', d: 'Precios, portes, plazos y emails' },
              { icon: KeyRound, t: 'Aprobación de farmacias', d: 'Valida nuevas altas con un click' },
            ].map((it) => (
              <li key={it.t} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/10">
                  <it.icon className="h-3.5 w-3.5 text-brand-200" />
                </span>
                <div>
                  <div className="font-medium text-white/90">{it.t}</div>
                  <div className="text-white/55 text-xs">{it.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pie del panel */}
        <footer className="relative flex items-center justify-between text-xs text-white/40">
          <span>© {new Date().getFullYear()} Lomhifar · Uso interno</span>
          <span className="hidden lg:inline">v1.0 · canal farmacia</span>
        </footer>
      </aside>

      {/* ============ Panel derecho — formulario de login ============ */}
      <section className="relative w-full lg:w-2/5 bg-white text-ink-900 flex items-center justify-center p-8 lg:p-12">
        {/* Cinta magenta superior decorativa que conecta con el lado izquierdo */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient" />

        <div className="w-full max-w-sm">
          {/* En móvil mostramos el lockup también arriba del form */}
          <div className="lg:hidden mb-8 flex justify-center">
            <BrandLockup variant="dark" size="md" />
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-brand-700 font-medium">
              Bienvenido de vuelta
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-ink-900">Acceso administrador</h2>
            <p className="mt-1 text-sm text-ink-500">
              Introduzca sus credenciales para gestionar la plataforma.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-8 pt-6 border-t border-ink-100 text-center text-xs text-ink-400">
            Acceso restringido al equipo Lomhifar.{' '}
            <a href="/" className="text-brand-700 hover:underline">
              Volver al inicio
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
