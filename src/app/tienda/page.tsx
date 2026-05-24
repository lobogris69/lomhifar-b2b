import { getSettings, SETTING_KEYS } from '@/lib/settings';
import { Configurator } from './Configurator';
import { Sparkles } from 'lucide-react';

export const metadata = { title: 'Configurador · Lomhifar' };

export default async function ShopPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <span className="badge-muted">
          <Sparkles className="h-3 w-3" /> Configurador de pulseras
        </span>
        <h1 className="mt-3 section-title">Diseñe su pulsera y añádala al carrito</h1>
        <p className="section-subtitle">
          Vea el grabado en tiempo real sobre la pulsera y confirme expresamente antes de continuar.
        </p>
      </div>

      <Configurator
        priceBlackCents={Number(settings[SETTING_KEYS.PRICE_BLACK_CENTS])}
        priceRedCents={Number(settings[SETTING_KEYS.PRICE_RED_CENTS])}
        maxCharsPerLine={Number(settings[SETTING_KEYS.MAX_CHARS_PER_LINE])}
        deliveryDays={Number(settings[SETTING_KEYS.DELIVERY_DAYS])}
      />
    </div>
  );
}
