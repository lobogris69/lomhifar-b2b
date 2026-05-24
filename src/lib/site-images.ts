import { promises as fs } from 'node:fs';
import path from 'node:path';
import { prisma } from './prisma';

/**
 * Catálogo de SLOTS de imagen del sitio.
 * Cada slot define un punto de personalización. El admin puede subir
 * cualquier imagen para reemplazar el default.
 *
 * Si NO hay subida custom:
 *   - hasDefaultFile: serve /public/defaults/{slot}.{ext}
 *   - hasComponentFallback: el componente renderiza su versión React/SVG
 */
export interface SlotDefinition {
  slot: string;
  group: 'branding' | 'producto' | 'casos' | 'hero';
  label: string;
  description: string;
  recommended: string;
  /** Si existe archivo por defecto en /public/defaults/ */
  defaultFile?: string;
  /** Si el componente tiene fallback propio (React/SVG) cuando no hay imagen */
  hasComponentFallback: boolean;
  /** MIME types aceptados al subir */
  accept: string[];
  /** Aspecto recomendado para la previsualización */
  aspect: string;
}

export const SLOTS: SlotDefinition[] = [
  // ============ BRANDING ============
  {
    slot: 'logo',
    group: 'branding',
    label: 'Logo principal',
    description:
      'Logo de Lomhifar usado en cabeceras, footer y emails. Sobre fondos claros.',
    recommended: 'PNG transparente · 600 × 200 px · sin fondo blanco',
    hasComponentFallback: true,
    accept: ['image/png', 'image/svg+xml', 'image/jpeg'],
    aspect: '3/1',
  },
  {
    slot: 'logo-light',
    group: 'branding',
    label: 'Logo blanco (fondos oscuros)',
    description:
      'Versión clara del logo para usarse sobre fondos oscuros (login admin).',
    recommended: 'PNG transparente con tipografía blanca · 600 × 200 px',
    hasComponentFallback: true,
    accept: ['image/png', 'image/svg+xml'],
    aspect: '3/1',
  },

  // ============ PRODUCTO ============
  {
    slot: 'product-main',
    group: 'producto',
    label: 'Foto producto principal',
    description:
      'Imagen principal del producto en la sección "El producto" de la landing.',
    recommended: 'JPG/PNG · ratio 4:3 · 1200 × 900 px aprox',
    defaultFile: 'product-main.jpg',
    hasComponentFallback: false,
    accept: ['image/jpeg', 'image/png'],
    aspect: '4/3',
  },
  {
    slot: 'acceso-bracelet',
    group: 'producto',
    label: 'Pulsera en página de acceso (foto real)',
    description:
      'Si subes una foto, sustituirá el dibujo SVG de la pulsera que aparece en la página de login de farmacias (/acceso). Si lo dejas vacío, se sigue mostrando el dibujo generado con los textos editables (color, línea 1 y línea 2).',
    recommended: 'JPG/PNG · ratio panorámico 4:1 (ej. 1600 × 400 px) · fondo neutro',
    hasComponentFallback: true,
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    aspect: '4/1',
  },

  // ============ CASOS REALES ============
  {
    slot: 'case-sofia',
    group: 'casos',
    label: 'Caso: Sofía (niña, asma)',
    description:
      'Foto opcional para el caso de Sofía. Si la subes reemplaza la tarjeta ilustrada.',
    recommended: 'JPG/PNG · ratio 5:4 · 1000 × 800 px (vertical-cuadrado)',
    hasComponentFallback: true,
    accept: ['image/jpeg', 'image/png'],
    aspect: '5/4',
  },
  {
    slot: 'case-carmen',
    group: 'casos',
    label: 'Caso: Carmen (alergia penicilina)',
    description:
      'Foto opcional para el caso de Carmen. Reemplaza la tarjeta ilustrada.',
    recommended: 'JPG/PNG · ratio 5:4 · 1000 × 800 px',
    hasComponentFallback: true,
    accept: ['image/jpeg', 'image/png'],
    aspect: '5/4',
  },
  {
    slot: 'case-andres',
    group: 'casos',
    label: 'Caso: Andrés (diabetes, deportista)',
    description: 'Foto opcional para el caso de Andrés.',
    recommended: 'JPG/PNG · ratio 5:4 · 1000 × 800 px',
    hasComponentFallback: true,
    accept: ['image/jpeg', 'image/png'],
    aspect: '5/4',
  },
  {
    slot: 'case-maria',
    group: 'casos',
    label: 'Caso: María (embarazo)',
    description: 'Foto opcional para el caso de María.',
    recommended: 'JPG/PNG · ratio 5:4 · 1000 × 800 px',
    hasComponentFallback: true,
    accept: ['image/jpeg', 'image/png'],
    aspect: '5/4',
  },
  {
    slot: 'case-pedro',
    group: 'casos',
    label: 'Caso: Don Pedro (Alzheimer)',
    description: 'Foto opcional para el caso de Don Pedro.',
    recommended: 'JPG/PNG · ratio 5:4 · 1000 × 800 px',
    hasComponentFallback: true,
    accept: ['image/jpeg', 'image/png'],
    aspect: '5/4',
  },
  {
    slot: 'case-lucia',
    group: 'casos',
    label: 'Caso: Lucía (anticoagulada)',
    description: 'Foto opcional para el caso de Lucía.',
    recommended: 'JPG/PNG · ratio 5:4 · 1000 × 800 px',
    hasComponentFallback: true,
    accept: ['image/jpeg', 'image/png'],
    aspect: '5/4',
  },
];

export const GROUP_LABELS: Record<SlotDefinition['group'], string> = {
  branding: 'Branding · Logo',
  producto: 'Imágenes de producto',
  casos: 'Galería "Casos reales"',
  hero: 'Imágenes de portada',
};

export const SLOT_NAMES = SLOTS.map((s) => s.slot);

export function getSlotDefinition(slot: string): SlotDefinition | undefined {
  return SLOTS.find((s) => s.slot === slot);
}

const DEFAULTS_DIR = path.join(process.cwd(), 'public', 'defaults');

/**
 * Devuelve los bytes + meta de la imagen actual para un slot.
 * 1. Busca registro custom en BD
 * 2. Si no hay, intenta leer /public/defaults/{defaultFile}
 * 3. Devuelve null si no hay nada
 */
export async function getSiteImageBytes(slot: string): Promise<{
  data: Buffer;
  mimeType: string;
  filename: string;
  isCustom: boolean;
} | null> {
  const def = getSlotDefinition(slot);
  if (!def) return null;

  let custom: Awaited<ReturnType<typeof prisma.siteImage.findUnique>> = null;
  try {
    custom = await prisma.siteImage.findUnique({ where: { slot } });
  } catch {
    custom = null;
  }
  if (custom) {
    return {
      data: Buffer.from(custom.data),
      mimeType: custom.mimeType,
      filename: custom.filename,
      isCustom: true,
    };
  }

  if (def.defaultFile) {
    try {
      const filePath = path.join(DEFAULTS_DIR, def.defaultFile);
      const data = await fs.readFile(filePath);
      return {
        data,
        mimeType: guessMime(def.defaultFile),
        filename: def.defaultFile,
        isCustom: false,
      };
    } catch {
      return null;
    }
  }

  return null;
}

export interface SiteImageMeta {
  slot: string;
  isCustom: boolean;
  hasImage: boolean;
  filename?: string;
  mimeType?: string;
  size?: number;
  updatedAt?: Date;
}

/**
 * Devuelve metadatos sin cargar el binario (rápido).
 * Es resiliente a fallos de BD (durante build, antes de db push, etc.) —
 * en ese caso cae al default sin romper el render.
 */
export async function getSiteImageMeta(slot: string): Promise<SiteImageMeta> {
  const def = getSlotDefinition(slot);
  if (!def) return { slot, isCustom: false, hasImage: false };

  let custom: { filename: string; mimeType: string; size: number; updatedAt: Date } | null = null;
  try {
    custom = await prisma.siteImage.findUnique({
      where: { slot },
      select: { filename: true, mimeType: true, size: true, updatedAt: true },
    });
  } catch {
    // BD no disponible (probable en build time) → usar default
    custom = null;
  }
  if (custom) {
    return {
      slot,
      isCustom: true,
      hasImage: true,
      filename: custom.filename,
      mimeType: custom.mimeType,
      size: custom.size,
      updatedAt: custom.updatedAt,
    };
  }

  if (def.defaultFile) {
    try {
      const filePath = path.join(DEFAULTS_DIR, def.defaultFile);
      const stat = await fs.stat(filePath);
      return {
        slot,
        isCustom: false,
        hasImage: true,
        filename: def.defaultFile,
        mimeType: guessMime(def.defaultFile),
        size: stat.size,
      };
    } catch {
      return { slot, isCustom: false, hasImage: false };
    }
  }

  return { slot, isCustom: false, hasImage: false };
}

/**
 * Devuelve metadatos de TODOS los slots (para el panel admin).
 * Resiliente a fallos de BD.
 */
export async function getAllSiteImageMeta(): Promise<SiteImageMeta[]> {
  let customRows: { slot: string; filename: string; mimeType: string; size: number; updatedAt: Date }[] = [];
  try {
    customRows = await prisma.siteImage.findMany({
      select: { slot: true, filename: true, mimeType: true, size: true, updatedAt: true },
    });
  } catch {
    customRows = [];
  }
  const customMap = new Map(customRows.map((r) => [r.slot, r]));

  const results = await Promise.all(
    SLOTS.map(async (def): Promise<SiteImageMeta> => {
      const custom = customMap.get(def.slot);
      if (custom) {
        return {
          slot: def.slot,
          isCustom: true,
          hasImage: true,
          filename: custom.filename,
          mimeType: custom.mimeType,
          size: custom.size,
          updatedAt: custom.updatedAt,
        };
      }
      if (def.defaultFile) {
        try {
          const stat = await fs.stat(path.join(DEFAULTS_DIR, def.defaultFile));
          return {
            slot: def.slot,
            isCustom: false,
            hasImage: true,
            filename: def.defaultFile,
            mimeType: guessMime(def.defaultFile),
            size: stat.size,
          };
        } catch {
          return { slot: def.slot, isCustom: false, hasImage: false };
        }
      }
      return { slot: def.slot, isCustom: false, hasImage: false };
    }),
  );
  return results;
}

function guessMime(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    case 'gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
}
