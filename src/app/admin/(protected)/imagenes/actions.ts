'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { getSlotDefinition, SLOT_NAMES } from '@/lib/site-images';

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

export interface UploadImageState {
  error?: string;
  ok?: boolean;
  slot?: string;
}

export async function uploadSiteImage(
  _prev: UploadImageState,
  formData: FormData,
): Promise<UploadImageState> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const slot = String(formData.get('slot') ?? '');
  if (!SLOT_NAMES.includes(slot)) return { error: 'Slot no válido', slot };

  const def = getSlotDefinition(slot)!;

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Adjunta un archivo', slot };
  if (file.size > MAX_BYTES) {
    return {
      error: `Archivo demasiado grande. Máximo ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`,
      slot,
    };
  }
  const mime = file.type || 'application/octet-stream';
  if (!def.accept.includes(mime.toLowerCase())) {
    return {
      error: `Formato no permitido. Aceptados: ${def.accept.join(', ')}.`,
      slot,
    };
  }

  const data = Buffer.from(await file.arrayBuffer());

  await prisma.siteImage.upsert({
    where: { slot },
    create: {
      slot,
      filename: sanitizeFilename(file.name),
      mimeType: mime,
      data,
      size: data.length,
      uploadedBy: session.email,
    },
    update: {
      filename: sanitizeFilename(file.name),
      mimeType: mime,
      data,
      size: data.length,
      uploadedBy: session.email,
    },
  });

  revalidatePath('/admin/imagenes');
  revalidatePath('/');
  return { ok: true, slot };
}

export async function deleteSiteImage(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  const slot = String(formData.get('slot') ?? '');
  if (!SLOT_NAMES.includes(slot)) return;
  await prisma.siteImage.deleteMany({ where: { slot } });
  revalidatePath('/admin/imagenes');
  revalidatePath('/');
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return base || 'image.jpg';
}
