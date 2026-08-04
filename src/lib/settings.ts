import { prisma } from './prisma';

/**
 * Claves de configuración del sistema (centralizadas para evitar typos).
 */
export const SETTING_KEYS = {
  PRICE_BLACK_CENTS: 'price.black.cents',
  PRICE_RED_CENTS: 'price.red.cents',
  PVPR_CENTS: 'price.pvpr.cents',
  SHIPPING_CENTS: 'shipping.cents',
  FREE_SHIPPING_THRESHOLD_CENTS: 'shipping.free_threshold.cents',
  MIN_ORDER_CENTS: 'order.minimum.cents',
  MIN_QUANTITY_PER_LINE: 'order.minimum_quantity_per_line',
  DELIVERY_DAYS: 'order.delivery_days',
  ORDERS_RECIPIENT_EMAILS: 'emails.orders_recipients',
  MAX_CHARS_PER_LINE: 'engraving.max_chars',
  COMPANY_NAME: 'company.name',
  COMPANY_PHONE: 'company.phone',
  COMPANY_EMAIL: 'company.email',
  CONFIGURATOR_AREA_BLACK: 'configurator.bracelet_black.area_json',
  CONFIGURATOR_AREA_RED: 'configurator.bracelet_red.area_json',
  MARKETING_PERSONAS_JSON: 'marketing.personas_json',
  SHIPPING_MODE: 'shipping.mode', // 'included' | 'separate'
  VOLUME_DISCOUNT_TIERS_JSON: 'discount.volume_tiers_json',
  // === IMPUESTOS ===
  TAX_VAT_PCT: 'tax.vat_pct',                       // p.ej. '21'
  TAX_EQUIV_SURCHARGE_PCT: 'tax.equiv_surcharge_pct', // p.ej. '5.2'
  TAX_EQUIV_SURCHARGE_ENABLED: 'tax.equiv_surcharge_enabled', // 'true' | 'false'
  // === TRAZABILIDAD / ENVÍOS ===
  SHIPPING_DEFAULT_CARRIER: 'shipping.default_carrier',
  SHIPPING_CARRIER_URLS_JSON: 'shipping.carrier_urls_json',
  // InPost webhooks
  SHIPPING_INPOST_WEBHOOK_SECRET: 'shipping.inpost.webhook_secret',
  SHIPPING_INPOST_SIGNATURE_MODE: 'shipping.inpost.signature_mode', // 'timestamp_body' | 'body_only'
  SHIPPING_NOTIFY_CUSTOMER: 'shipping.notify_customer', // 'true' | 'false'
  // === MONDIAL RELAY (SOAP API) ===
  // Credenciales que da la oficina comercial de Mondial Relay/InPost.
  SHIPPING_MR_ENSEIGNE: 'shipping.mr.enseigne',         // p.ej. 'BDTEST' (test) o código real
  SHIPPING_MR_PRIVATE_KEY: 'shipping.mr.private_key',   // clave usada para firmar (MD5)
  SHIPPING_MR_MODE: 'shipping.mr.mode',                 // 'test' | 'production'
  SHIPPING_MR_ENABLED: 'shipping.mr.enabled',           // 'true' | 'false'
  // Datos por defecto del REMITENTE (tu empresa - aparecen en las etiquetas)
  SHIPPING_MR_SENDER_NAME: 'shipping.mr.sender_name',
  SHIPPING_MR_SENDER_STREET: 'shipping.mr.sender_street',
  SHIPPING_MR_SENDER_CITY: 'shipping.mr.sender_city',
  SHIPPING_MR_SENDER_CP: 'shipping.mr.sender_cp',
  SHIPPING_MR_SENDER_COUNTRY: 'shipping.mr.sender_country',
  SHIPPING_MR_SENDER_PHONE: 'shipping.mr.sender_phone',
  SHIPPING_MR_SENDER_EMAIL: 'shipping.mr.sender_email',
  // Modo de COLECTA: cómo entrego YO el paquete a MR
  //   'CDR' = yo lo dejo en un Punto Pack/Locker cerca de mí (lo más común)
  //   'CCC' = MR pasa a recoger a mi domicilio (requiere contrato comercial)
  SHIPPING_MR_COLLECT_MODE: 'shipping.mr.collect_mode',
  // Si CollectMode=CDR y tienes SIEMPRE el mismo locker de drop-off, su ID
  SHIPPING_MR_COLLECT_RELAY_ID: 'shipping.mr.collect_relay_id',
  // Modo de ENTREGA: cómo MR entrega al cliente final
  //   'LDS' = entrega a domicilio con firma (recomendado)
  //   'LD1' = entrega a domicilio sin firma
  //   '24R' = entrega en Punto Pack/Locker (el cliente va a recogerlo)
  SHIPPING_MR_DELIVERY_MODE: 'shipping.mr.delivery_mode',
  // Peso por defecto del pedido en gramos (las pulseras pesan poco)
  SHIPPING_MR_DEFAULT_WEIGHT_G: 'shipping.mr.default_weight_g',
  // === LÁSER (generación de archivos DXF para EZCAD) ===
  // Dimensiones y márgenes en MILÍMETROS del área imprimible de la placa.
  // El origen (0,0) del DXF queda en la ESQUINA INFERIOR IZQUIERDA de la
  // placa (misma convención que EZCAD/JCZ). El generador respeta márgenes
  // y centra el texto dentro del área útil (ancho − izq − der / alto − sup − inf).
  LASER_PLATE_WIDTH_MM: 'laser.plate_width_mm',
  LASER_PLATE_HEIGHT_MM: 'laser.plate_height_mm',
  LASER_MARGIN_LEFT_MM: 'laser.margin_left_mm',
  LASER_MARGIN_RIGHT_MM: 'laser.margin_right_mm',
  LASER_MARGIN_TOP_MM: 'laser.margin_top_mm',
  LASER_MARGIN_BOTTOM_MM: 'laser.margin_bottom_mm',
  LASER_LINE_HEIGHT_FACTOR: 'laser.line_height_factor', // 1.0 = pegadas, 1.2 = holgadas
  LASER_CURVE_STEPS: 'laser.curve_steps',               // resolución de curvas Bézier (10-60)
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  [SETTING_KEYS.PRICE_BLACK_CENTS]: '350', // 3,50 €
  [SETTING_KEYS.PRICE_RED_CENTS]: '350',
  [SETTING_KEYS.PVPR_CENTS]: '2495', // 24,95 € PVP recomendado al paciente
  [SETTING_KEYS.SHIPPING_CENTS]: '595', // 5,95 €
  [SETTING_KEYS.FREE_SHIPPING_THRESHOLD_CENTS]: '5000', // 50 €
  [SETTING_KEYS.MIN_ORDER_CENTS]: '0',
  [SETTING_KEYS.MIN_QUANTITY_PER_LINE]: '1',
  [SETTING_KEYS.DELIVERY_DAYS]: '7',
  [SETTING_KEYS.ORDERS_RECIPIENT_EMAILS]:
    process.env.ORDERS_RECIPIENT_EMAILS ?? 'pedidos@lomhifar.com',
  [SETTING_KEYS.MAX_CHARS_PER_LINE]: '19',
  [SETTING_KEYS.COMPANY_NAME]: 'Lomhifar',
  [SETTING_KEYS.COMPANY_PHONE]: '',
  [SETTING_KEYS.COMPANY_EMAIL]: 'pedidos@lomhifar.com',
  // Área de impresión en % (left, top, width, height) + rotación grados + color del láser
  // Default pensado para placa típica con SÍMBOLO médico a la izquierda y
  // hueco de grabado a la derecha (formato más común de las pulseras médicas).
  // textColor = tono típico del grabado láser sobre aluminio natural pulido:
  // el láser quema la superficie y deja una marca GRIS OSCURA (antracita /
  // grafito), no clara. Con mix-blend-mode: multiply sobre la placa
  // plateada da una apariencia realista de grabado físico.
  [SETTING_KEYS.CONFIGURATOR_AREA_BLACK]: JSON.stringify({
    leftPct: 50, topPct: 42, widthPct: 22, heightPct: 14, rotationDeg: 0, textColor: '#1f1f24',
  }),
  [SETTING_KEYS.CONFIGURATOR_AREA_RED]: JSON.stringify({
    leftPct: 50, topPct: 42, widthPct: 22, heightPct: 14, rotationDeg: 0, textColor: '#1f1f24',
  }),
  // Personas/casos de uso (editables desde /admin/personas)
  [SETTING_KEYS.MARKETING_PERSONAS_JSON]: '', // vacío = usar DEFAULT_PERSONAS
  // Modo de portes (default: incluidos en el precio — no se cobra envío)
  [SETTING_KEYS.SHIPPING_MODE]: 'included',
  // Tramos de descuento por volumen (vacío = sin descuentos)
  // Formato: [{ minQuantity: number, discountPct: number }]
  [SETTING_KEYS.VOLUME_DISCOUNT_TIERS_JSON]: JSON.stringify([
    { minQuantity: 10, discountPct: 5 },
    { minQuantity: 25, discountPct: 10 },
    { minQuantity: 50, discountPct: 15 },
    { minQuantity: 100, discountPct: 20 },
  ]),
  // === Impuestos por defecto (España, B2B farmacia)
  [SETTING_KEYS.TAX_VAT_PCT]: '21',
  [SETTING_KEYS.TAX_EQUIV_SURCHARGE_PCT]: '5.2',
  [SETTING_KEYS.TAX_EQUIV_SURCHARGE_ENABLED]: 'true', // farmacias suelen estar bajo este régimen
  // === Trazabilidad / envíos
  [SETTING_KEYS.SHIPPING_DEFAULT_CARRIER]: 'inpost',
  [SETTING_KEYS.SHIPPING_CARRIER_URLS_JSON]: JSON.stringify({
    inpost: 'https://inpost.es/track/{number}',
    seur: 'https://www.seur.com/es/particulares/herramientas/livetracking?segOnlineIdentifier={number}',
    mrw: 'https://www.mrw.es/seguimiento_envios/MRW_seguimiento_online.asp?numero_envio={number}',
    correos: 'https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number={number}',
  }),
  [SETTING_KEYS.SHIPPING_INPOST_WEBHOOK_SECRET]: '', // vacío = webhooks no activos
  [SETTING_KEYS.SHIPPING_INPOST_SIGNATURE_MODE]: 'timestamp_body',
  [SETTING_KEYS.SHIPPING_NOTIFY_CUSTOMER]: 'true',
  // === Mondial Relay (defaults vacíos / sandbox)
  [SETTING_KEYS.SHIPPING_MR_ENSEIGNE]: '',
  [SETTING_KEYS.SHIPPING_MR_PRIVATE_KEY]: '',
  [SETTING_KEYS.SHIPPING_MR_MODE]: 'test',
  [SETTING_KEYS.SHIPPING_MR_ENABLED]: 'false',
  [SETTING_KEYS.SHIPPING_MR_SENDER_NAME]: 'Lomhifar',
  [SETTING_KEYS.SHIPPING_MR_SENDER_STREET]: '',
  [SETTING_KEYS.SHIPPING_MR_SENDER_CITY]: '',
  [SETTING_KEYS.SHIPPING_MR_SENDER_CP]: '',
  [SETTING_KEYS.SHIPPING_MR_SENDER_COUNTRY]: 'ES',
  [SETTING_KEYS.SHIPPING_MR_SENDER_PHONE]: '',
  [SETTING_KEYS.SHIPPING_MR_SENDER_EMAIL]: '',
  [SETTING_KEYS.SHIPPING_MR_COLLECT_MODE]: 'CDR',         // por defecto yo dejo en locker
  [SETTING_KEYS.SHIPPING_MR_COLLECT_RELAY_ID]: '',        // vacío = auto-buscar más cercano al CP origen
  [SETTING_KEYS.SHIPPING_MR_DELIVERY_MODE]: 'LDS',        // por defecto: entrega a domicilio del cliente con firma
  [SETTING_KEYS.SHIPPING_MR_DEFAULT_WEIGHT_G]: '100',
  // === Láser (defaults medidos en la placa REAL: área de grabado
  // 24 × 10 mm — medida del arco desarrollado, superficie ligeramente
  // curva). Márgenes de seguridad 0,5 mm en las 4 esquinas → área útil
  // efectiva 23 × 9 mm. El admin ajusta todo desde /admin/laser tras la
  // primera prueba física (sin tocar código).
  [SETTING_KEYS.LASER_PLATE_WIDTH_MM]: '24',
  [SETTING_KEYS.LASER_PLATE_HEIGHT_MM]: '10',
  [SETTING_KEYS.LASER_MARGIN_LEFT_MM]: '0.5',
  [SETTING_KEYS.LASER_MARGIN_RIGHT_MM]: '0.5',
  [SETTING_KEYS.LASER_MARGIN_TOP_MM]: '0.5',
  [SETTING_KEYS.LASER_MARGIN_BOTTOM_MM]: '0.5',
  // 1.25 = 25% de separación entre líneas (para 2 filas legibles);
  // en 1 sola línea este factor no afecta (se usa toda la altura).
  [SETTING_KEYS.LASER_LINE_HEIGHT_FACTOR]: '1.25',
  [SETTING_KEYS.LASER_CURVE_STEPS]: '24',
};

// ============================================================
// IMPUESTOS (IVA + Recargo de equivalencia)
// ============================================================

export interface TaxConfig {
  vatPct: number;
  equivSurchargePct: number;
  equivSurchargeEnabled: boolean;
}

export function parseTaxConfig(
  vatRaw: string | undefined,
  equivPctRaw: string | undefined,
  equivEnabledRaw: string | undefined,
): TaxConfig {
  const vatPct = clamp01to50(Number(vatRaw), 21);
  const equivSurchargePct = clamp01to50(Number(equivPctRaw), 5.2);
  const equivSurchargeEnabled = equivEnabledRaw === 'true';
  return { vatPct, equivSurchargePct, equivSurchargeEnabled };
}

function clamp01to50(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n < 0 || n > 50) return fallback;
  return n;
}

// ============================================================
// PORTES / SHIPPING
// ============================================================

export type ShippingMode = 'included' | 'separate';

export function parseShippingMode(raw: string | undefined): ShippingMode {
  return raw === 'separate' ? 'separate' : 'included';
}

// ============================================================
// DESCUENTOS POR VOLUMEN
// ============================================================

export interface VolumeDiscountTier {
  minQuantity: number;
  discountPct: number; // 0 - 50
}

export function parseVolumeDiscountTiers(raw: string | undefined): VolumeDiscountTier[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const tiers = arr
      .map((t) => ({
        minQuantity: Math.max(1, Math.floor(Number(t?.minQuantity) || 0)),
        discountPct: Math.max(0, Math.min(50, Number(t?.discountPct) || 0)),
      }))
      .filter((t) => t.minQuantity > 0 && t.discountPct > 0)
      // Orden ASC por cantidad → fácil iterar para encontrar próximo tramo
      .sort((a, b) => a.minQuantity - b.minQuantity);
    return tiers;
  } catch {
    return [];
  }
}

/** Devuelve el tramo APLICABLE (el de mayor descuento que cumpla el mínimo). */
export function findApplicableTier(
  quantity: number,
  tiers: VolumeDiscountTier[],
): VolumeDiscountTier | null {
  let best: VolumeDiscountTier | null = null;
  for (const t of tiers) {
    if (quantity >= t.minQuantity) {
      if (!best || t.discountPct > best.discountPct) best = t;
    }
  }
  return best;
}

/** Devuelve el SIGUIENTE tramo (primero con minQuantity mayor que quantity actual). */
export function findNextTier(
  quantity: number,
  tiers: VolumeDiscountTier[],
): VolumeDiscountTier | null {
  return tiers.find((t) => t.minQuantity > quantity) ?? null;
}

export interface PrintArea {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  rotationDeg: number;
  textColor: string;
}

export const DEFAULT_PRINT_AREA: PrintArea = {
  leftPct: 50, topPct: 42, widthPct: 22, heightPct: 14, rotationDeg: 0, textColor: '#1f1f24',
};

/**
 * Personas / casos de uso mostrados en la sección "Para todos los pacientes"
 * de la landing. Editables desde /admin/personas. Cada persona puede tener
 * además una foto custom (slot persona-1 ... persona-8) que reemplaza el
 * dibujo SVG de la pulsera.
 */
export interface MarketingPersona {
  emoji: string;
  group: string;
  ageRange: string;
  context: string;
  color: 'BLACK' | 'RED';
  line1: string;
  line2: string;
  why: string;
}

export const DEFAULT_PERSONAS: MarketingPersona[] = [
  {
    emoji: '🧒',
    group: 'Niños',
    ageRange: '4 - 12 años',
    context: 'Asma, alergias graves, epilepsia infantil',
    color: 'RED',
    line1: 'ASMA · EPILEPSIA',
    line2: 'MAMÁ 666 111 222',
    why: 'En el cole, parque o excursiones — si no están con sus padres, la pulsera habla por ellos.',
  },
  {
    emoji: '🧑‍🎓',
    group: 'Adolescentes',
    ageRange: '13 - 18 años',
    context: 'Diabetes, alergia a frutos secos',
    color: 'BLACK',
    line1: 'ALÉRGICO NUECES',
    line2: 'EPIPEN · 666 222 333',
    why: 'Salidas con amigos, viajes, deporte. Más vergonzoso explicar la patología que llevarla bien grabada.',
  },
  {
    emoji: '🤰',
    group: 'Embarazadas',
    ageRange: '18 - 45 años',
    context: 'Embarazo de riesgo, RH negativo, gestacional',
    color: 'RED',
    line1: 'EMBARAZO 32 SEM',
    line2: 'GINEC 666 333 444',
    why: 'Información crítica en urgencias. En caso de accidente, el equipo médico sabe que hay dos vidas.',
  },
  {
    emoji: '🏃',
    group: 'Deportistas',
    ageRange: '20 - 60 años',
    context: 'Asma de esfuerzo, cardiopatía, diabetes',
    color: 'BLACK',
    line1: 'CARDIO · ASMA',
    line2: 'TFNO 666 444 555',
    why: 'Running, ciclismo, montaña. Lejos del coche y los papeles, la muñeca es donde miran los sanitarios.',
  },
  {
    emoji: '👨',
    group: 'Adultos',
    ageRange: '30 - 65 años',
    context: 'Diabetes, hipertensión, anticoagulación',
    color: 'RED',
    line1: 'DIABETES TIPO 2',
    line2: 'METFORMINA',
    why: 'Vida laboral activa. Ante un mareo o accidente, sus compañeros y los servicios saben qué hacer.',
  },
  {
    emoji: '👩‍⚕️',
    group: 'Patologías raras',
    ageRange: 'Toda edad',
    context: 'Porfiria, Addison, hemofilia',
    color: 'BLACK',
    line1: 'PORFIRIA',
    line2: 'NO BARBITÚR.',
    why: 'Las enfermedades minoritarias no las conoce todo el personal sanitario. Su pulsera evita errores.',
  },
  {
    emoji: '👵',
    group: 'Mayores',
    ageRange: '65+ años',
    context: 'Alzheimer, demencia, marcapasos',
    color: 'RED',
    line1: 'ALZHEIMER',
    line2: 'TFNO 666 555 666',
    why: 'Pueden desorientarse y alejarse de casa. La pulsera permite que cualquiera contacte con la familia.',
  },
  {
    emoji: '♿',
    group: 'Discapacidad',
    ageRange: 'Toda edad',
    context: 'Autismo, sordomudez, parálisis cerebral',
    color: 'BLACK',
    line1: 'TEA · NO HABLA',
    line2: 'TUTOR 666 666 777',
    why: 'Personas que no pueden comunicar verbalmente sus necesidades médicas. La pulsera lo hace por ellas.',
  },
];

export function parsePersonas(raw: string | undefined): MarketingPersona[] {
  if (!raw) return DEFAULT_PERSONAS;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return DEFAULT_PERSONAS;
    // Normalizamos cada persona, conservando defaults si faltan campos
    return arr.slice(0, 8).map((p, i) => {
      const def = DEFAULT_PERSONAS[i] ?? DEFAULT_PERSONAS[0];
      return {
        emoji: typeof p?.emoji === 'string' ? p.emoji : def.emoji,
        group: typeof p?.group === 'string' ? p.group : def.group,
        ageRange: typeof p?.ageRange === 'string' ? p.ageRange : def.ageRange,
        context: typeof p?.context === 'string' ? p.context : def.context,
        color: p?.color === 'BLACK' || p?.color === 'RED' ? p.color : def.color,
        line1: typeof p?.line1 === 'string' ? p.line1 : def.line1,
        line2: typeof p?.line2 === 'string' ? p.line2 : def.line2,
        why: typeof p?.why === 'string' ? p.why : def.why,
      } satisfies MarketingPersona;
    });
  } catch {
    return DEFAULT_PERSONAS;
  }
}

/**
 * Colores típicos de grabado láser sobre aluminio sin pintura (presets admin).
 * El láser ablaciona la superficie del aluminio creando una textura mate
 * más oscura que el pulido circundante. El tono real depende del acabado
 * del aluminio (pulido, cepillado) y de la intensidad del láser.
 */
export const ENGRAVING_PRESETS = [
  { label: 'Aluminio pulido (suave)', value: '#8a8a8c', description: 'Tono claro tipo "Estrella de la Vida"' },
  { label: 'Aluminio pulido (medio)', value: '#7d7d80', description: 'Default: grabado láser estándar' },
  { label: 'Aluminio cepillado', value: '#6d6d72', description: 'Algo más oscuro, contrastado' },
  { label: 'Grabado profundo', value: '#5e5e62', description: 'Para placas con más pase de láser' },
] as const;

// Lista de tonos antiguos de grabado que se quedaron demasiado claros sobre
// la placa con mix-blend-mode: multiply. Se sustituyen en lectura por el
// nuevo default (#1f1f24, grafito) sin necesidad de tocar la BD. Si el
// admin ha elegido un color custom DIFERENTE a estos, se respeta.
const LEGACY_LASER_COLORS = new Set([
  '#7d7d80', '#7D7D80',
  '#3a3a3e', '#3A3A3E',
]);

export function parsePrintArea(raw: string | undefined): PrintArea {
  if (!raw) return DEFAULT_PRINT_AREA;
  try {
    const obj = JSON.parse(raw);
    let textColor = DEFAULT_PRINT_AREA.textColor;
    if (typeof obj.textColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(obj.textColor)) {
      textColor = LEGACY_LASER_COLORS.has(obj.textColor)
        ? DEFAULT_PRINT_AREA.textColor
        : obj.textColor;
    }
    return {
      leftPct: clampNum(obj.leftPct, 0, 100, DEFAULT_PRINT_AREA.leftPct),
      topPct: clampNum(obj.topPct, 0, 100, DEFAULT_PRINT_AREA.topPct),
      widthPct: clampNum(obj.widthPct, 1, 100, DEFAULT_PRINT_AREA.widthPct),
      heightPct: clampNum(obj.heightPct, 1, 100, DEFAULT_PRINT_AREA.heightPct),
      rotationDeg: clampNum(obj.rotationDeg, -180, 180, DEFAULT_PRINT_AREA.rotationDeg),
      textColor,
    };
  } catch {
    return DEFAULT_PRINT_AREA;
  }
}

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function getSetting(key: SettingKey): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (row) return row.value;
  return DEFAULT_SETTINGS[key];
}

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await prisma.setting.findMany();
  const out: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    out[row.key] = row.value;
  }
  return out as Record<SettingKey, string>;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function ensureDefaultSettings(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }
}

export function parseRecipients(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}
