'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export interface UploadPosterState {
  error?: string;
  ok?: boolean;
}

export async function uploadPoster(
  _prev: UploadPosterState,
  formData: FormData,
): Promise<UploadPosterState> {
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  const session = await requireAdmin({ write: true });

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Adjunte un archivo' };
  if (file.size > MAX_BYTES) {
    return {
      error: `El archivo es demasiado grande. Máximo ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`,
    };
  }
  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME.includes(mime.toLowerCase())) {
    return { error: 'Formato no permitido. Use PDF, PNG o JPG.' };
  }

  const data = Buffer.from(await file.arrayBuffer());

  // Sustituir: borramos cualquier anterior y guardamos el nuevo
  await prisma.$transaction([
    prisma.posterFile.deleteMany({}),
    prisma.posterFile.create({
      data: {
        filename: sanitizeFilename(file.name),
        mimeType: mime,
        data,
        size: data.length,
        uploadedBy: session.email,
      },
    }),
  ]);

  revalidatePath('/admin/cartel');
  return { ok: true };
}

export async function deletePoster() {
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  await requireAdmin({ write: true });
  await prisma.posterFile.deleteMany({});
  revalidatePath('/admin/cartel');
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return base || 'cartel.pdf';
}
