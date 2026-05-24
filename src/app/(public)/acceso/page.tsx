import Link from 'next/link';
import { ShieldCheck, KeyRound, Mail, Building2, Lock } from 'lucide-react';
import { AccessForm } from './AccessForm';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';

export const metadata = { title: 'Acceso farmacia · Lomhifar' };

export default async function AccessPage() {
  const session = await getCustomerSession();
  if (session) redirect('/tienda');

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-2 gap-12 items-start">
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-800">
            <Building2 className="h-3.5 w-3.5" /> Para farmacias clientes
          </div>
          <h1 className="mt-4 section-title text-3xl">Acceso para farmacias autorizadas</h1>
          <p className="section-subtitle text-base">
            Verifique su identidad con el CIF de la farmacia y el email registrado en
            nuestra base de datos.
          </p>
        </div>

        <ul className="space-y-3">
          {[
            { icon: ShieldCheck, title: 'Validación por CIF + email', desc: 'Comprobamos que ambos coinciden con un cliente activo.' },
            { icon: Mail, title: 'Código enviado al email', desc: 'Recibirá un código de 6 dígitos válido durante 15 minutos.' },
            { icon: KeyRound, title: 'Sesión segura de 7 días', desc: 'Tras introducir el código accederá al configurador y al historial de pedidos.' },
          ].map((s) => (
            <li key={s.title} className="flex gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 shrink-0">
                <s.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink-900">{s.title}</div>
                <div className="text-sm text-ink-600">{s.desc}</div>
              </div>
            </li>
          ))}
        </ul>

        {/* Atajo discreto para el administrador de Lomhifar */}
        <div className="mt-8 pt-6 border-t border-ink-100">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-xs text-ink-500 hover:text-ink-800 transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            ¿Eres administrador de Lomhifar? <span className="text-brand-700 font-medium">Entra aquí</span>
          </Link>
        </div>
      </div>

      <div>
        <div className="card p-8 lg:p-10">
          <AccessForm />
        </div>
        <p className="mt-4 text-center text-xs text-ink-500">
          Este formulario es <strong>solo para farmacias</strong>. Si eres el administrador de Lomhifar,{' '}
          <Link href="/admin/login" className="text-brand-700 font-medium hover:underline">
            accede al panel de gestión
          </Link>.
        </p>
      </div>
    </div>
  );
}
