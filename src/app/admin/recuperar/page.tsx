import Link from 'next/link';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { BrandLockup } from '@/components/brand/BrandMark';
import { RequestResetForm } from './RequestForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recuperar contraseña · Admin Lomhifar' };

export default function RequestResetPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-white">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <BrandLockup variant="light" size="md" />
          </div>
          <div className="bg-white text-ink-900 rounded-2xl shadow-soft p-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-semibold text-ink-900">Recuperar contraseña</h1>
                <p className="text-xs text-ink-500">Te enviaremos un enlace por email</p>
              </div>
            </div>
            <RequestResetForm />
            <p className="mt-6 text-center text-xs text-ink-400">
              <Link href="/admin/login" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                <ArrowLeft className="h-3 w-3" /> Volver al login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
