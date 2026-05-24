'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { ADMIN_ROLES, type AdminRole } from '@/lib/admin-roles';

async function ensureSuperAdmin() {
  const s = await getAdminSession();
  if (!s) redirect('/admin/login');
  if (s.role !== 'SUPER_ADMIN') {
    throw new Error('No autorizado: solo SUPER_ADMIN puede gestionar usuarios');
  }
  return s;
}

const createSchema = z.object({
  email: z.string().email('Email no válido').max(120),
  name: z.string().max(120).optional().or(z.literal('')),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'] as const),
});

export interface CreateAdminState {
  error?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
}

export async function createAdminUser(
  _prev: CreateAdminState,
  formData: FormData,
): Promise<CreateAdminState> {
  await ensureSuperAdmin();
  const parsed = createSchema.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    name: String(formData.get('name') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    role: String(formData.get('role') ?? ''),
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe };
  }

  const exists = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: 'Ya existe un usuario admin con ese email' };

  await prisma.adminUser.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name || null,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: parsed.data.role,
      active: true,
      mustChangePassword: true,  // al primer login se le obliga a cambiarla
    },
  });

  revalidatePath('/admin/usuarios');
  return { ok: true };
}

export async function toggleAdminActive(formData: FormData) {
  const session = await ensureSuperAdmin();
  const id = String(formData.get('id') ?? '');
  if (id === session.id) return; // no puede desactivarse a sí mismo
  const u = await prisma.adminUser.findUnique({ where: { id } });
  if (!u) return;
  await prisma.adminUser.update({ where: { id }, data: { active: !u.active } });
  revalidatePath('/admin/usuarios');
}

export async function deleteAdminUser(formData: FormData) {
  const session = await ensureSuperAdmin();
  const id = String(formData.get('id') ?? '');
  if (id === session.id) return; // no puede borrarse a sí mismo
  await prisma.adminUser.delete({ where: { id } }).catch(() => null);
  revalidatePath('/admin/usuarios');
}

export async function changeAdminRole(formData: FormData) {
  const session = await ensureSuperAdmin();
  const id = String(formData.get('id') ?? '');
  const role = String(formData.get('role') ?? '') as AdminRole;
  if (!ADMIN_ROLES.includes(role)) return;
  if (id === session.id && role !== 'SUPER_ADMIN') {
    // no puede quitarse el rol SUPER_ADMIN a sí mismo
    return;
  }
  await prisma.adminUser.update({ where: { id }, data: { role } });
  revalidatePath('/admin/usuarios');
}

export async function resetAdminPassword(formData: FormData) {
  await ensureSuperAdmin();
  const id = String(formData.get('id') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  if (newPassword.length < 8) return;
  await prisma.adminUser.update({
    where: { id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 12),
      mustChangePassword: true,  // al próximo login se le obliga a cambiarla
    },
  });
  revalidatePath('/admin/usuarios');
}
