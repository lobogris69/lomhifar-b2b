import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CustomerForm } from '../CustomerForm';

export const metadata = { title: 'Nuevo cliente · Admin Lomhifar' };

export default function NewCustomerPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl">
      <Link href="/admin/clientes" className="inline-flex items-center text-sm text-ink-500 hover:text-ink-800 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a clientes
      </Link>
      <h1 className="section-title mb-6">Añadir cliente</h1>
      <div className="card p-6">
        <CustomerForm />
      </div>
    </div>
  );
}
