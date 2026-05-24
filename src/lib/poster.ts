import { promises as fs } from 'node:fs';
import path from 'node:path';
import { prisma } from './prisma';

export const DEFAULT_POSTER_FILENAME = 'cartel-lomhifar.pdf';
export const DEFAULT_POSTER_PATH = path.join(
  process.cwd(),
  'public',
  'downloads',
  'cartel-lomhifar-default.pdf',
);
export const DEFAULT_POSTER_PREVIEW_PATH = path.join(
  process.cwd(),
  'public',
  'downloads',
  'cartel-preview.png',
);

export interface PosterMeta {
  isCustom: boolean;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt?: Date;
}

/**
 * Devuelve los metadatos del cartel actual (sin cargar el binario).
 * Si el admin ha subido uno → usa ese. Si no → cartel por defecto.
 */
export async function getCurrentPosterMeta(): Promise<PosterMeta> {
  const custom = await prisma.posterFile.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  });
  if (custom) {
    return {
      isCustom: true,
      filename: custom.filename,
      mimeType: custom.mimeType,
      size: custom.size,
      uploadedAt: custom.createdAt,
    };
  }

  // Default — leer tamaño del archivo en disco
  try {
    const stat = await fs.stat(DEFAULT_POSTER_PATH);
    return {
      isCustom: false,
      filename: DEFAULT_POSTER_FILENAME,
      mimeType: 'application/pdf',
      size: stat.size,
    };
  } catch {
    return {
      isCustom: false,
      filename: DEFAULT_POSTER_FILENAME,
      mimeType: 'application/pdf',
      size: 0,
    };
  }
}

/**
 * Devuelve los bytes + meta del cartel actual.
 */
export async function getCurrentPosterBytes(): Promise<{
  data: Buffer;
  mimeType: string;
  filename: string;
} | null> {
  const custom = await prisma.posterFile.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  if (custom) {
    return {
      data: Buffer.from(custom.data),
      mimeType: custom.mimeType,
      filename: custom.filename,
    };
  }
  try {
    const data = await fs.readFile(DEFAULT_POSTER_PATH);
    return {
      data,
      mimeType: 'application/pdf',
      filename: DEFAULT_POSTER_FILENAME,
    };
  } catch {
    return null;
  }
}
