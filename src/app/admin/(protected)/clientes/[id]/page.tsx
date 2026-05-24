import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CustomerForm } from '../CustomerForm';

export const metadata = { title: 'Editar cliente · Admin Lomhifar' };

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const c = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!c) notFound();

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <Link href="/admin/clientes" className="inline-flex items-center text-sm text-ink-500 hover:text-ink-800 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a clientes
      </Link>
      <h1 className="section-title mb-1">{c.pharmacyName}</h1>
      <p className="section-subtitle mb-6">Editar datos del cliente</p>
      <div className="card p-6">
        <CustomerForm customer={c} />
      </div>
    </div>
  );
}
