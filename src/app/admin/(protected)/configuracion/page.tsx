import { Settings } from 'lucide-react';
import {
  getSettings,
  SETTING_KEYS,
  parseShippingMode,
  parseVolumeDiscountTiers,
} from '@/lib/settings';
import { isEmailConfigured } from '@/lib/email';
import { getAdminSession } from '@/lib/auth';
import { SettingsForm } from './SettingsForm';
import { EmailDiagnostic } from './EmailDiagnostic';

export const metadata = { title: 'Configuración · Admin Lomhifar' };

export default async function SettingsPage() {
  const [s, session] = await Promise.all([getSettings(), getAdminSession()]);
  const emailOk = isEmailConfigured();
  const centsToEuro = (c: string) => (Number(c) / 100).toFixed(2).replace('.', ',');
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Configuración</h1>
          <p className="section-subtitle">Precios, portes, plazos y datos de empresa.</p>
        </div>
      </div>

      {/* Diagnóstico de email — arriba porque es crítico para que todo
          el flujo (altas, códigos de acceso, avisos de pedido) funcione. */}
      <div className="mb-6">
        <EmailDiagnostic configured={emailOk} adminEmail={session?.email ?? ''} />
      </div>

      <SettingsForm
        initialValues={{
          priceBlackEuros: centsToEuro(s[SETTING_KEYS.PRICE_BLACK_CENTS]),
          priceRedEuros: centsToEuro(s[SETTING_KEYS.PRICE_RED_CENTS]),
          pvprEuros: centsToEuro(s[SETTING_KEYS.PVPR_CENTS]),
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
          shippingMode: parseShippingMode(s[SETTING_KEYS.SHIPPING_MODE]),
          volumeDiscountTiers: parseVolumeDiscountTiers(s[SETTING_KEYS.VOLUME_DISCOUNT_TIERS_JSON]),
          vatPct: s[SETTING_KEYS.TAX_VAT_PCT] ?? '21',
          equivSurchargePct: s[SETTING_KEYS.TAX_EQUIV_SURCHARGE_PCT] ?? '5.2',
          equivSurchargeEnabled: s[SETTING_KEYS.TAX_EQUIV_SURCHARGE_ENABLED] === 'true',
        }}
        inpost={{
          webhookSecret: s[SETTING_KEYS.SHIPPING_INPOST_WEBHOOK_SECRET] ?? '',
          signatureMode: (s[SETTING_KEYS.SHIPPING_INPOST_SIGNATURE_MODE] === 'body_only'
            ? 'body_only'
            : 'timestamp_body'),
          notifyCustomer: (s[SETTING_KEYS.SHIPPING_NOTIFY_CUSTOMER] ?? 'true') === 'true',
          webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://pulseraspersonalizadas.lomhifar.net'}/api/webhooks/inpost`,
        }}
        mondialRelay={{
          enseigne: s[SETTING_KEYS.SHIPPING_MR_ENSEIGNE] ?? '',
          privateKey: s[SETTING_KEYS.SHIPPING_MR_PRIVATE_KEY] ?? '',
          mode: s[SETTING_KEYS.SHIPPING_MR_MODE] === 'production' ? 'production' : 'test',
          enabled: (s[SETTING_KEYS.SHIPPING_MR_ENABLED] ?? 'false') === 'true',
          senderName: s[SETTING_KEYS.SHIPPING_MR_SENDER_NAME] ?? '',
          senderStreet: s[SETTING_KEYS.SHIPPING_MR_SENDER_STREET] ?? '',
          senderCity: s[SETTING_KEYS.SHIPPING_MR_SENDER_CITY] ?? '',
          senderCP: s[SETTING_KEYS.SHIPPING_MR_SENDER_CP] ?? '',
          senderCountry: s[SETTING_KEYS.SHIPPING_MR_SENDER_COUNTRY] ?? 'ES',
          senderPhone: s[SETTING_KEYS.SHIPPING_MR_SENDER_PHONE] ?? '',
          senderEmail: s[SETTING_KEYS.SHIPPING_MR_SENDER_EMAIL] ?? '',
          collectMode: s[SETTING_KEYS.SHIPPING_MR_COLLECT_MODE] ?? 'CDR',
          collectRelayId: s[SETTING_KEYS.SHIPPING_MR_COLLECT_RELAY_ID] ?? '',
          deliveryMode: s[SETTING_KEYS.SHIPPING_MR_DELIVERY_MODE] ?? 'LDS',
          defaultWeightG: s[SETTING_KEYS.SHIPPING_MR_DEFAULT_WEIGHT_G] ?? '100',
        }}
      />
    </div>
  );
}
