import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * VÍA DE EMERGENCIA para resetear la contraseña de un admin cuando el
 * email de recuperación no funciona (p.ej. SMTP mal configurado).
 *
 * Está DESHABILITADO por defecto: solo funciona si existe la variable
 * de entorno EMERGENCY_RESET_KEY en Railway. Sin esa variable devuelve
 * 404 (como si no existiera).
 *
 * Uso (desde el navegador):
 *   /api/admin/emergency-password?key=<EMERGENCY_RESET_KEY>&email=<admin>&password=<nueva>
 *
 * Tras recuperar el acceso, se recomienda BORRAR la variable
 * EMERGENCY_RESET_KEY de Railway para volver a deshabilitar el endpoint.
 */
export async function GET(req: Request) {
  const configuredKey = process.env.EMERGENCY_RESET_KEY;
  // Deshabilitado si no hay clave configurada.
  if (!configuredKey) {
    return new NextResponse('Not found', { status: 404 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get('key') ?? '';
  const email = normalizeEmail(url.searchParams.get('email') ?? '');
  const password = url.searchParams.get('password') ?? '';

  if (key !== configuredKey) {
    return new NextResponse('Clave incorrecta', { status: 403 });
  }
  if (!email.includes('@')) {
    return new NextResponse('Falta el parámetro email', { status: 400 });
  }
  if (password.length < 8) {
    return new NextResponse('La contraseña debe tener al menos 8 caracteres (parámetro password)', { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    return new NextResponse(`No existe ningún admin con el email ${email}`, { status: 404 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      active: true,
      mustChangePassword: false,
    },
  });

  return new NextResponse(
    `✅ Contraseña de ${email} actualizada correctamente.\n\n` +
    `Ya puedes entrar en /admin/login con esa contraseña.\n\n` +
    `IMPORTANTE: por seguridad, borra ahora la variable EMERGENCY_RESET_KEY de Railway ` +
    `para deshabilitar este endpoint.`,
    { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
