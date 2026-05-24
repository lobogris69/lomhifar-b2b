import { Mail } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CodeForm } from './CodeForm';

export const metadata = { title: 'Verificar código · Lomhifar' };

export default async function CodePage() {
  const customerId = cookies().get('lomhifar_pending_access')?.value;
  if (!customerId) redirect('/acceso');

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { email: true, pharmacyName: true },
  });
  if (!customer) redirect('/acceso');

  // Ofuscar el email para mostrarlo
  const [local, domain] = customer.email.split('@');
  const masked = `${local.slice(0, 2)}${'•'.repeat(Math.max(2, local.length - 2))}@${domain}`;

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="card p-8 lg:p-10">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 mb-3">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Introduzca su código</h1>
          <p className="mt-1 text-sm text-ink-500">
            Hemos enviado un código de 6 dígitos a <strong>{masked}</strong>
          </p>
        </div>
        <CodeForm />
      </div>
    </div>
  );
}
