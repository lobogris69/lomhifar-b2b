import { Settings } from 'lucide-react';
import { getSettings, SETTING_KEYS } from '@/lib/settings';
import { SettingsForm } from './SettingsForm';

export const metadata = { title: 'Configuración · Admin Lomhifar' };

export default async function SettingsPage() {
  const s = await getSettings();
  const centsToEuro = (c: string) => (Number(c) / 100).toFixed(2).replace('.', ',');
  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Configuración</h1>
          <p className="section-subtitle">Precios, portes, plazos y datos de empresa.</p>
        </div>
      </div>

      <SettingsForm
        initialValues={{
          priceBlackEuros: centsToEuro(s[SETTING_KEYS.PRICE_BLACK_CENTS]),
          priceRedEuros: centsToEuro(s[SETTING_KEYS.PRICE_RED_CENTS]),
          shippingEuros: centsToEuro(s[SETTING_KEYS.SHIPPING_CENTS]),
          freeShippingThresholdEuros: centsToEuro(s[SETTING_KEYS.FREE_SHIPPING_THRESHOLD_CENTS]),
          minOrderEuros: centsToEuro(s[SETTING_KEYS.MIN_ORDER_CENTS]),
          minQuantityPerLine: s[SETTING_KEYS.MIN_QUANTITY_PER_LINE],
          deliveryDays: s[SETTING_KEYS.DELIVERY_DAYS],
          ordersRecipientEmails: s[SETTING_KEYS.ORDERS_RECIPIENT_EMAILS],
          maxCharsPerLine: s[SETTING_KEYS.MAX_CHARS_PER_LINE],
          companyName: s[SETTING_KEYS.COMPANY_NAME],
          companyPhone: s[SETTING_KEYS.COMPANY_PHONE],
          companyEmail: s[SETTING_KEYS.COMPANY_EMAIL],
        }}
      />
    </div>
  );
}
