import { prisma } from './prisma';

/**
 * Catálogo de textos editables del sitio.
 * Se almacenan en la tabla Setting con la clave `text.<seccion>.<campo>`.
 * Si no hay valor custom guardado → se usa el `defaultValue`.
 */

export type TextType = 'short' | 'long' | 'select';

export interface TextSlot {
  key: string;                  // p.ej. "acceso.titulo"
  group: 'acceso' | 'landing' | 'tienda' | 'producto' | 'general';
  groupLabel: string;
  label: string;                // Título del campo en el admin
  description?: string;         // Ayuda contextual
  defaultValue: string;
  type: TextType;
  maxLength?: number;
  options?: { value: string; label: string }[];
}

export const TEXT_SLOTS: TextSlot[] = [
  // ============ PÁGINA DE ACCESO (/acceso) ============
  {
    key: 'acceso.badge',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Etiqueta superior',
    description: 'Texto pequeño en mayúsculas arriba del título principal',
    defaultValue: 'Plataforma B2B · Canal farmacia',
    type: 'short',
    maxLength: 60,
  },
  {
    key: 'acceso.titulo_principal',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Título principal (primera línea)',
    description: 'Aparece en negro grande',
    defaultValue: 'Pulseras sanitarias',
    type: 'short',
    maxLength: 50,
  },
  {
    key: 'acceso.titulo_destacado',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Título destacado (segunda línea)',
    description: 'Aparece debajo con gradient magenta',
    defaultValue: 'personalizadas',
    type: 'short',
    maxLength: 50,
  },
  {
    key: 'acceso.descripcion',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Descripción bajo el título',
    description: 'Párrafo explicativo (1-2 líneas)',
    defaultValue:
      'Acceda al portal exclusivo de Lomhifar para pedir pulseras de identificación médica con grabado láser, listas para entregar a sus pacientes.',
    type: 'long',
    maxLength: 400,
  },
  {
    key: 'acceso.feature_1_titulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 1 — Título',
    defaultValue: 'Diseño en vivo',
    type: 'short',
    maxLength: 30,
  },
  {
    key: 'acceso.feature_1_desc',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 1 — Descripción',
    defaultValue: 'Vea el grabado al escribir',
    type: 'short',
    maxLength: 60,
  },
  {
    key: 'acceso.feature_2_titulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 2 — Título',
    defaultValue: 'Para cualquier paciente',
    type: 'short',
    maxLength: 30,
  },
  {
    key: 'acceso.feature_2_desc',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 2 — Descripción',
    defaultValue: 'Niños, adultos, mayores',
    type: 'short',
    maxLength: 60,
  },
  {
    key: 'acceso.feature_3_titulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 3 — Título',
    defaultValue: 'Acceso solo farmacias',
    type: 'short',
    maxLength: 30,
  },
  {
    key: 'acceso.feature_3_desc',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 3 — Descripción',
    defaultValue: 'Verificación por CIF + email',
    type: 'short',
    maxLength: 60,
  },
  {
    key: 'acceso.form_titulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Cabecera del formulario',
    defaultValue: 'Acceso farmacias',
    type: 'short',
    maxLength: 40,
  },
  {
    key: 'acceso.form_subtitulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Texto bajo la cabecera del formulario',
    defaultValue: 'Identifíquese con su CIF y email',
    type: 'short',
    maxLength: 80,
  },

  // ============ PULSERA DEMO MOSTRADA EN /acceso ============
  {
    key: 'acceso.demo_color',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Pulsera de ejemplo — Color',
    defaultValue: 'BLACK',
    type: 'select',
    options: [
      { value: 'BLACK', label: 'Negra' },
      { value: 'RED', label: 'Roja' },
    ],
  },
  {
    key: 'acceso.demo_linea1',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Pulsera de ejemplo — Línea 1 grabada',
    defaultValue: 'DIABETES TIPO 1',
    type: 'short',
    maxLength: 14,
  },
  {
    key: 'acceso.demo_linea2',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Pulsera de ejemplo — Línea 2 grabada',
    defaultValue: 'TFNO 666 123 456',
    type: 'short',
    maxLength: 14,
  },

  // ============ LANDING PRINCIPAL (/) ============
  {
    key: 'landing.hero_badge',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Etiqueta superior del hero',
    defaultValue: 'Plataforma privada · Acceso solo farmacias',
    type: 'short', maxLength: 80,
  },
  {
    key: 'landing.hero_titulo_1',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Título — Primera línea',
    defaultValue: 'Pulseras sanitarias',
    type: 'short', maxLength: 60,
  },
  {
    key: 'landing.hero_titulo_destacado',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Título — Línea destacada (gradient)',
    defaultValue: 'personalizadas',
    type: 'short', maxLength: 60,
  },
  {
    key: 'landing.hero_titulo_2',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Título — Tercera línea',
    defaultValue: 'para su farmacia.',
    type: 'short', maxLength: 60,
  },
  {
    key: 'landing.hero_descripcion',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Descripción del hero',
    defaultValue:
      'Lomhifar pone a disposición del canal farmacia un sistema profesional para pedir pulseras de identificación médica con grabado láser, listas para entregar al paciente. Negras o rojas, dos líneas de grabado a láser sobre placa de aluminio de 4 × 1 cm.',
    type: 'long', maxLength: 500,
  },
  {
    key: 'landing.hero_cta_principal',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Botón principal',
    defaultValue: 'Acceder con CIF y email',
    type: 'short', maxLength: 40,
  },
  {
    key: 'landing.hero_cta_secundario',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Botón secundario',
    defaultValue: 'Solicitar alta de farmacia',
    type: 'short', maxLength: 40,
  },
  {
    key: 'landing.hero_stat1_valor',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 1 — Valor',
    defaultValue: '22 × 1',
    type: 'short', maxLength: 20,
  },
  {
    key: 'landing.hero_stat1_label',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 1 — Texto',
    defaultValue: 'cm pulsera',
    type: 'short', maxLength: 30,
  },
  {
    key: 'landing.hero_stat2_valor',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 2 — Valor',
    defaultValue: '4 × 1',
    type: 'short', maxLength: 20,
  },
  {
    key: 'landing.hero_stat2_label',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 2 — Texto',
    defaultValue: 'cm placa aluminio',
    type: 'short', maxLength: 30,
  },
  {
    key: 'landing.hero_stat3_valor',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 3 — Valor',
    defaultValue: '7 días',
    type: 'short', maxLength: 20,
  },
  {
    key: 'landing.hero_stat3_label',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 3 — Texto',
    defaultValue: 'plazo entrega',
    type: 'short', maxLength: 30,
  },
  {
    key: 'landing.cta_final_titulo',
    group: 'landing',
    groupLabel: 'Landing principal · CTA final',
    label: 'CTA final — Título',
    defaultValue: '¿Su farmacia trabaja ya con Lomhifar?',
    type: 'short', maxLength: 100,
  },
  {
    key: 'landing.cta_final_descripcion',
    group: 'landing',
    groupLabel: 'Landing principal · CTA final',
    label: 'CTA final — Descripción',
    defaultValue:
      'Acceda con su CIF y el email registrado. Si aún no es cliente, solicite el alta y nuestro equipo validará su farmacia en horas hábiles.',
    type: 'long', maxLength: 300,
  },

  // ============ SECCIÓN "EL PRODUCTO" ============
  {
    key: 'producto.titulo',
    group: 'producto',
    groupLabel: 'Sección "El producto" (landing)',
    label: 'Título',
    defaultValue: 'Pulsera de silicona médica con placa de aluminio grabada a láser',
    type: 'short', maxLength: 120,
  },
  {
    key: 'producto.descripcion',
    group: 'producto',
    groupLabel: 'Sección "El producto" (landing)',
    label: 'Descripción',
    defaultValue:
      'Silicona hipoalergénica de grado médico, cierre regulable, placa central de aluminio con grabado láser permanente en tono antracita.',
    type: 'long', maxLength: 400,
  },

  // ============ CONFIGURADOR (/tienda) ============
  {
    key: 'tienda.badge',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Etiqueta superior',
    defaultValue: 'Configurador de pulseras',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Título principal',
    defaultValue: 'Diseñe su pulsera y añádala al carrito',
    type: 'short', maxLength: 100,
  },
  {
    key: 'tienda.descripcion',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Descripción',
    defaultValue:
      'Vea el grabado en tiempo real sobre la pulsera y confirme expresamente antes de continuar.',
    type: 'long', maxLength: 300,
  },
  {
    key: 'tienda.paso1_titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Paso 1 — Título',
    defaultValue: '1. Color de la pulsera',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.paso2_titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Paso 2 — Título',
    defaultValue: '2. Unidades',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.paso3_titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Paso 3 — Título',
    defaultValue: '3. Texto grabado',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.paso4_titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Paso 4 — Título',
    defaultValue: '4. Confirmación',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.confirmacion_texto',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Texto del checkbox de confirmación',
    description: 'Importante: este texto el cliente DEBE marcarlo expresamente antes de añadir al carrito',
    defaultValue:
      'Confirmo que el color, las unidades y el texto grabado son correctos. Entiendo que las pulseras se fabricarán exactamente con estos datos.',
    type: 'long', maxLength: 400,
  },
];

// Prefijo de la clave en la tabla Setting (para no chocar con ajustes de negocio)
const KEY_PREFIX = 'text.';
const storageKey = (slot: string) => `${KEY_PREFIX}${slot}`;

/**
 * Obtiene UN texto. Devuelve el valor custom si existe, o el default.
 * Resiliente ante fallos de BD (build time).
 */
export async function getSiteText(slotKey: string): Promise<string> {
  const def = TEXT_SLOTS.find((s) => s.key === slotKey);
  if (!def) return '';
  try {
    const row = await prisma.setting.findUnique({ where: { key: storageKey(slotKey) } });
    return row?.value ?? def.defaultValue;
  } catch {
    return def.defaultValue;
  }
}

/**
 * Obtiene TODOS los textos como mapa. Devuelve defaults para los que no
 * estén guardados. Resiliente ante fallos.
 */
export async function getAllSiteTexts(): Promise<Record<string, string>> {
  const defaults = Object.fromEntries(TEXT_SLOTS.map((s) => [s.key, s.defaultValue]));
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
    });
    const result = { ...defaults };
    for (const row of rows) {
      const k = row.key.slice(KEY_PREFIX.length);
      if (k in result) result[k] = row.value;
    }
    return result;
  } catch {
    return defaults;
  }
}

/**
 * Devuelve los textos en formato lista para el panel admin
 * (incluye metadata del slot + valor actual + flag isCustom).
 */
export interface SiteTextWithMeta extends TextSlot {
  currentValue: string;
  isCustom: boolean;
}

export async function getAllSiteTextsWithMeta(): Promise<SiteTextWithMeta[]> {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.setting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
      select: { key: true, value: true },
    });
  } catch {
    rows = [];
  }
  const customByKey = new Map(
    rows.map((r) => [r.key.slice(KEY_PREFIX.length), r.value] as const),
  );
  return TEXT_SLOTS.map((slot) => {
    const custom = customByKey.get(slot.key);
    return {
      ...slot,
      currentValue: custom ?? slot.defaultValue,
      isCustom: custom !== undefined,
    };
  });
}

/**
 * Guarda o restaura un texto.
 * - Si value es igual al default → borra el registro (vuelve a default).
 * - Si value es distinto → upsert.
 */
export async function setSiteText(slotKey: string, value: string): Promise<void> {
  const def = TEXT_SLOTS.find((s) => s.key === slotKey);
  if (!def) return;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === def.defaultValue) {
    await prisma.setting.deleteMany({ where: { key: storageKey(slotKey) } });
  } else {
    await prisma.setting.upsert({
      where: { key: storageKey(slotKey) },
      create: { key: storageKey(slotKey), value: trimmed },
      update: { value: trimmed },
    });
  }
}

export async function resetSiteText(slotKey: string): Promise<void> {
  await prisma.setting.deleteMany({ where: { key: storageKey(slotKey) } });
}
