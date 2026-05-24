'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { adminLoginSchema } from '@/lib/validations';
import { createAdminSession } from '@/lib/auth';

export interface AdminLoginState {
  error?: string;
  email?: string;
}

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const raw = {
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? ''),
  };
  const parsed = adminLoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: 'Email o contraseña no válidos', email: raw.email };
  }
  const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { error: 'Credenciales incorrectas', email: raw.email };
  if (!user.active) {
    return { error: 'Esta cuenta está desactivada. Contacta con el administrador.', email: raw.email };
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return { error: 'Credenciales incorrectas', email: raw.email };

  await createAdminSession(user);
  // Si tiene que cambiar password, lo mandamos directo a su perfil
  if (user.mustChangePassword) {
    redirect('/admin/perfil?mustChange=1');
  }
  redirect('/admin');
}
