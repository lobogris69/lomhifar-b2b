'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken, normalizeEmail } from '@/lib/utils';
import { emailLayout, sendEmail } from '@/lib/email';

const RESET_TTL_MIN = 60;

const requestSchema = z.object({
  email: z.string().email('Email no válido'),
});

export interface RequestResetState {
  ok?: boolean;
  error?: string;
}

export async function requestReset(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const raw = String(formData.get('email') ?? '');
  const parsed = requestSchema.safeParse({ email: raw });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Email no válido' };

  const email = normalizeEmail(parsed.data.email);
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  // No revelamos si el email existe o no (anti-enumeration). Siempre devolvemos OK.
  if (!admin || !admin.active) return { ok: true };

  const token = generateToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;

  await prisma.adminPasswordReset.create({
    data: { adminId: admin.id, token, expiresAt, ip },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const link = `${baseUrl}/admin/recuperar/${token}`;

  // El email va en try/catch: si el SMTP falla, NO reventamos la página
  // con un 500. El token queda creado igualmente en BD (por si se arregla
  // el email) y mantenemos el anti-enumeration devolviendo siempre ok.
  try {
    await sendEmail({
      to: email,
      subject: 'Recuperar contraseña · Lomhifar',
      html: emailLayout(`
        <h2 style="margin:0 0 12px;color:#921a5e;">Recuperar contraseña</h2>
        <p style="margin:0 0 12px;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta administrador.</p>
        <p style="margin:0 0 18px;">Haz click en el botón para crear una contraseña nueva. El enlace es válido durante <strong>${RESET_TTL_MIN} minutos</strong>.</p>
        <p style="margin:18px 0;text-align:center;">
          <a href="${link}" style="background:linear-gradient(135deg,#921a5e 0%,#d12686 100%);color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
            Restablecer contraseña
          </a>
        </p>
        <p style="margin:18px 0 0;color:#54545f;font-size:12px;">Si no has solicitado este cambio, ignora este correo. Tu contraseña no será modificada.</p>
        <p style="margin:8px 0 0;color:#a0a0a8;font-size:11px;word-break:break-all;">Enlace directo: ${link}</p>
      `, { preheader: 'Recupera el acceso a tu cuenta admin de Lomhifar' }),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[recuperar] no se pudo enviar el email de recuperación:', e);
  }

  return { ok: true };
}

const completeSchema = z
  .object({
    token: z.string().min(20),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres').max(120),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export interface CompleteResetState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function completeReset(
  _prev: CompleteResetState,
  formData: FormData,
): Promise<CompleteResetState> {
  const parsed = completeSchema.safeParse({
    token: String(formData.get('token') ?? ''),
    newPassword: String(formData.get('newPassword') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe };
  }

  const row = await prisma.adminPasswordReset.findUnique({
    where: { token: parsed.data.token },
    include: { admin: true },
  });

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { error: 'Enlace no válido o caducado. Solicita uno nuevo.' };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: row.adminId },
      data: { passwordHash: newHash },
    }),
    prisma.adminPasswordReset.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    // Invalidar cualquier otro token pendiente del mismo admin
    prisma.adminPasswordReset.updateMany({
      where: { adminId: row.adminId, usedAt: null, id: { not: row.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect('/admin/login?reset=ok');
}
