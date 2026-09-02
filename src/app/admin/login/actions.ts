'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { adminLoginSchema } from '@/lib/validations';
import { createAdminSession } from '@/lib/auth';

// Hash señuelo (bcrypt) para comparar cuando el email no existe: iguala el
// tiempo de respuesta y evita que se pueda enumerar qué correos son de admin
// midiendo cuánto tarda. Se calcula una sola vez al cargar el módulo.
const DUMMY_HASH = bcrypt.hashSync('lomhifar-usuario-inexistente', 12);

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
  // Comparar SIEMPRE (contra el hash señuelo si el email no existe) para no
  // delatar por tiempo si un correo es de admin. Y no distinguir "no existe"
  // de "contraseña incorrecta": mismo mensaje genérico para ambos.
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: 'Credenciales incorrectas', email: raw.email };
  // Solo tras acertar la contraseña revelamos que la cuenta está inhabilitada
  // (si no, se podría descubrir qué emails son de admins desactivados).
  if (!user.active) {
    return { error: 'Esta cuenta está desactivada. Contacta con el administrador.', email: raw.email };
  }

  await createAdminSession(user);
  // Si tiene que cambiar password, lo mandamos directo a su perfil
  if (user.mustChangePassword) {
    redirect('/admin/perfil?mustChange=1');
  }
  redirect('/admin');
}
