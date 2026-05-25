'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Introduce tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(120),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas nuevas no coinciden',
    path: ['confirmPassword'],
  });

const changeProfileSchema = z.object({
  name: z.string().max(120).optional(),
});

export interface ChangePasswordState {
  error?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
}

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  // VIEWER también puede cambiar su propia contraseña (no es escritura de
  // datos del sitio — es su propio perfil personal).
  const session = await requireAdmin();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get('currentPassword') ?? ''),
    newPassword: String(formData.get('newPassword') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe };
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: session.id } });
  if (!admin) return { error: 'Usuario no encontrado' };

  const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) return { fieldErrors: { currentPassword: 'Contraseña actual incorrecta' } };

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  revalidatePath('/admin/perfil');
  return { ok: true };
}

export interface ChangeProfileState {
  error?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
}

export async function changeProfile(
  _prev: ChangeProfileState,
  formData: FormData,
): Promise<ChangeProfileState> {
  // VIEWER también puede editar su propio nombre.
  const session = await requireAdmin();

  const parsed = changeProfileSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
  });
  if (!parsed.success) return { error: 'Datos no válidos' };

  await prisma.adminUser.update({
    where: { id: session.id },
    data: { name: parsed.data.name || null },
  });
  revalidatePath('/admin/perfil');
  return { ok: true };
}
