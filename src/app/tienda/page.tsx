import {
  getSettings,
  SETTING_KEYS,
  parsePrintArea,
  parseShippingMode,
  parseVolumeDiscountTiers,
} from '@/lib/settings';
import { getStockSummary } from '@/lib/stock';
import { getAllSiteTexts } from '@/lib/site-texts';
import { getSiteImageMeta } from '@/lib/site-images';
import { Configurator } from './Configurator';
import { Sparkles, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configurador · Lomhifar' };

export default async function ShopPage() {
  const [settings, stocks, t, photoBlackMeta, photoRedMeta] = await Promise.all([
    getSettings(),
    getStockSummary(),
    getAllSiteTexts(),
    getSiteImageMeta('configurator-bracelet-black'),
    getSiteImageMeta('configurator-bracelet-red'),
  ]);

  // Solo usamos foto si el admin ha subido una custom (no la default que no existe)
  const photoBlackUrl = photoBlackMeta.isCustom && photoBlackMeta.hasImage
    ? `/api/images/configurator-bracelet-black?v=${photoBlackMeta.updatedAt?.getTime() ?? 0}`
    : null;
  const photoRedUrl = photoRedMeta.isCustom && photoRedMeta.hasImage
    ? `/api/images/configurator-bracelet-red?v=${photoRedMeta.updatedAt?.getTime() ?? 0}`
    : null;

  const areaBlack = parsePrintArea(settings[SETTING_KEYS.CONFIGURATOR_AREA_BLACK]);
  const areaRed = parsePrintArea(settings[SETTING_KEYS.CONFIGURATOR_AREA_RED]);
  const shippingMode = parseShippingMode(settings[SETTING_KEYS.SHIPPING_MODE]);
  const volumeDiscountTiers = parseVolumeDiscountTiers(settings[SETTING_KEYS.VOLUME_DISCOUNT_TIERS_JSON]);

  const lowOrEmpty = stocks.filter((s) => s.isLow || s.isEmpty);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <span className="badge-muted">
          <Sparkles className="h-3 w-3" /> {t['tienda.badge']}
        </span>
        <h1 className="mt-3 section-title">{t['tienda.titulo']}</h1>
        <p className="section-subtitle">{t['tienda.descripcion']}</p>
      </div>

      {lowOrEmpty.length > 0 && (
        <div className="mb-6 space-y-2">
          {lowOrEmpty.map((s) => {
            const colorName = s.color === 'BLACK' ? 'negra' : 'roja';
            return (
              <div
                key={s.color}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  s.isEmpty
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${s.isEmpty ? 'text-red-600' : 'text-amber-600'}`} />
                <div>
                  {s.isEmpty ? (
                    <>
                      <strong>Sin stock disponible:</strong> la pulsera {colorName} está
                      temporalmente agotada. Puede pedirla igualmente — el plazo de entrega
                      podría alargarse mientras reponemos. Mientras tanto, considere la otra opción.
                    </>
                  ) : (
                    <>
                      <strong>Stock limitado:</strong> quedan {s.quantity} pulseras {colorName} disponibles.
                      Si necesita una cantidad superior, contacte con Lomhifar antes de confirmar.
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Configurator
        priceBlackCents={Number(settings[SETTING_KEYS.PRICE_BLACK_CENTS])}
        priceRedCents={Number(settings[SETTING_KEYS.PRICE_RED_CENTS])}
        pvprCents={Number(settings[SETTING_KEYS.PVPR_CENTS])}
        maxCharsPerLine={Number(settings[SETTING_KEYS.MAX_CHARS_PER_LINE])}
        deliveryDays={Number(settings[SETTING_KEYS.DELIVERY_DAYS])}
        photoBlackUrl={photoBlackUrl}
        photoRedUrl={photoRedUrl}
        areaBlack={areaBlack}
        areaRed={areaRed}
        volumeDiscountTiers={volumeDiscountTiers}
        shippingIncluded={shippingMode === 'included'}
        texts={{
          paso1: t['tienda.paso1_titulo'],
          paso2: t['tienda.paso2_titulo'],
          paso3: t['tienda.paso3_titulo'],
          paso4: t['tienda.paso4_titulo'],
          confirmacion: t['tienda.confirmacion_texto'],
          pvprEtiqueta: t['pvpr.etiqueta'],
          pvprMargenTexto: t['pvpr.margen_texto'],
          pvfLabel: t['tienda.precio_pvf_label'],
          pvprLabel: t['tienda.precio_pvpr_label'],
        }}
      />
    </div>
  );
}
