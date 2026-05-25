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
  // textColor = tono típico del grabado láser sobre aluminio pulido sin pintar:
  // un gris frostado similar al de la propia "Estrella de la Vida" estampada.
  [SETTING_KEYS.CONFIGURATOR_AREA_BLACK]: JSON.stringify({
    leftPct: 50, topPct: 42, widthPct: 22, heightPct: 14, rotationDeg: 0, textColor: '#7d7d80',
  }),
  [SETTING_KEYS.CONFIGURATOR_AREA_RED]: JSON.stringify({
    leftPct: 50, topPct: 42, widthPct: 22, heightPct: 14, rotationDeg: 0, textColor: '#7d7d80',
  }),
  // Personas/casos de uso (editables desde /admin/personas)
  [SETTING_KEYS.MARKETING_PERSONAS_JSON]: '', // vacío = usar DEFAULT_PERSONAS
};

export interface PrintArea {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  rotationDeg: number;
  textColor: string;
}

export const DEFAULT_PRINT_AREA: PrintArea = {
  leftPct: 50, topPct: 42, widthPct: 22, heightPct: 14, rotationDeg: 0, textColor: '#7d7d80',
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

export function parsePrintArea(raw: string | undefined): PrintArea {
  if (!raw) return DEFAULT_PRINT_AREA;
  try {
    const obj = JSON.parse(raw);
    return {
      leftPct: clampNum(obj.leftPct, 0, 100, DEFAULT_PRINT_AREA.leftPct),
      topPct: clampNum(obj.topPct, 0, 100, DEFAULT_PRINT_AREA.topPct),
      widthPct: clampNum(obj.widthPct, 1, 100, DEFAULT_PRINT_AREA.widthPct),
      heightPct: clampNum(obj.heightPct, 1, 100, DEFAULT_PRINT_AREA.heightPct),
      rotationDeg: clampNum(obj.rotationDeg, -180, 180, DEFAULT_PRINT_AREA.rotationDeg),
      textColor: typeof obj.textColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(obj.textColor)
        ? obj.textColor
        : DEFAULT_PRINT_AREA.textColor,
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
