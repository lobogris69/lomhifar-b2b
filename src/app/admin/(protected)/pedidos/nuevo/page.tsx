import Link from 'next/link';
import { ArrowLeft, ClipboardPlus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSettings, SETTING_KEYS } from '@/lib/settings';
import { ManualOrderForm } from './ManualOrderForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nuevo pedido manual · Admin Lomhifar' };

export default async function NewManualOrderPage() {
  const [customers, settings] = await Promise.all([
    prisma.customer.findMany({
      where: { active: true },
      orderBy: { pharmacyName: 'asc' },
      select: {
        id: true, cif: true, pharmacyName: true, email: true, city: true, active: true,
      },
    }),
    getSettings(),
  ]);

  const maxCharsPerLine = Number(settings[SETTING_KEYS.MAX_CHARS_PER_LINE]) || 19;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl space-y-6">
      <div>
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a pedidos
        </Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <ClipboardPlus className="h-5 w-5" />
          </span>
          <div>
            <h1 className="section-title">Nuevo pedido manual</h1>
            <p className="section-subtitle">
              Para pedidos que llegan por teléfono, WhatsApp, visita comercial, nota escrita o email.
            </p>
          </div>
        </div>
      </div>

      <ManualOrderForm customers={customers} maxCharsPerLine={maxCharsPerLine} />
    </div>
  );
}
