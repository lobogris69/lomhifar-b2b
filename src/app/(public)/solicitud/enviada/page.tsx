import Link from 'next/link';
import { CheckCircle2, Mail, Clock, ShieldCheck } from 'lucide-react';
import { getAllSiteTexts } from '@/lib/site-texts';

// El layout público renderiza el Logo (consulta BD) → render dinámico
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Solicitud enviada · Lomhifar' };

export default async function SentPage() {
  const t = await getAllSiteTexts();
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="section-title">¡Solicitud enviada correctamente!</h1>
        <p className="section-subtitle mt-2">
          Hemos recibido los datos de tu farmacia. Estos son los siguientes pasos:
        </p>
      </div>

      {/* Pasos claros */}
      <div className="mt-8 space-y-3">
        <Step
          icon={Mail}
          n={1}
          title="Revisa tu correo electrónico"
          desc={
            <>
              Te hemos enviado un <strong>email de confirmación</strong> con tu número de
              referencia. <strong>Si no lo ves en unos minutos, mira la carpeta de SPAM
              o «Correo no deseado»</strong> y marca el mensaje como «No es spam» para
              recibir bien los siguientes.
            </>
          }
        />
        <Step
          icon={Clock}
          n={2}
          title="Revisamos tu solicitud"
          desc="Nuestro equipo comprueba los datos de tu farmacia. Normalmente en horas hábiles."
        />
        <Step
          icon={ShieldCheck}
          n={3}
          title="Recibirás el alta por email"
          desc={
            <>
              Cuando se apruebe, te llegará un correo con las instrucciones para
              acceder con tu <strong>CIF y tu email</strong>. A partir de ahí ya podrás
              hacer pedidos de pulseras.
            </>
          }
        />
      </div>

      <div className="mt-8 rounded-xl border border-ink-100 bg-ink-50/40 p-4 text-center text-sm text-ink-600">
        ¿No te ha llegado nada y han pasado varias horas? Escríbenos a{' '}
        <a href="mailto:pedidos@lomhifar.es" className="text-brand-700 font-medium hover:underline">
          pedidos@lomhifar.es
        </a>{' '}
        y lo revisamos.
      </div>

      <div className="mt-8 flex justify-center gap-3 flex-wrap">
        <Link href="/" className="btn-secondary">Volver al inicio</Link>
        <Link href="/acceso" className="btn-primary">Ya soy cliente · Acceder</Link>
      </div>
    </div>
  );
}

function Step({
  icon: Icon, n, title, desc,
}: {
  icon: React.ElementType; n: number; title: string; desc: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-4">
      <div className="relative shrink-0">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" />
        </span>
        <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 text-white text-[11px] font-bold">
          {n}
        </span>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        <p className="text-sm text-ink-600 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
