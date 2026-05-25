'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { loginSchema, codeSchema } from '@/lib/validations';
import { generateCode, normalizeCif, normalizeEmail } from '@/lib/utils';
import { emailLayout, sendEmail } from '@/lib/email';
import { createCustomerSession, getTrustedDeviceCustomerId, setTrustedDevice } from '@/lib/auth';
import { cookies, headers } from 'next/headers';

const PENDING_COOKIE = 'lomhifar_pending_access';
const CODE_TTL_MIN = 15;

export interface AccessFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  notFound?: boolean;
  cif?: string;
  email?: string;
}

export async function requestAccessCode(
  _prev: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  const raw = {
    cif: String(formData.get('cif') ?? ''),
    email: String(formData.get('email') ?? ''),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors, cif: raw.cif, email: raw.email };
  }

  const cif = normalizeCif(parsed.data.cif);
  const email = normalizeEmail(parsed.data.email);

  const customer = await prisma.customer.findFirst({
    where: { cif, email },
  });

  if (!customer) {
    return { notFound: true, cif, email };
  }

  if (!customer.active) {
    return {
      error:
        'Su farmacia consta en nuestro sistema pero no está activa. Contacte con Lomhifar.',
      cif,
      email,
    };
  }

  const ip =
    headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;
  const ua = headers().get('user-agent') ?? undefined;

  // -------- BYPASS PARA PREVIEW LOCAL --------
  // Si PREVIEW_BYPASS_CODE=true, omitimos el código por email y creamos
  // sesión directamente. NO USAR EN PRODUCCIÓN.
  if (process.env.PREVIEW_BYPASS_CODE === 'true') {
    await createCustomerSession(customer.id, { ip, userAgent: ua });
    redirect('/tienda');
  }
  // -------------------------------------------

  // -------- DISPOSITIVO DE CONFIANZA --------
  // Si este navegador ya verificó código antes para ESTE mismo cliente,
  // no le volvemos a pedir el código de 6 dígitos. Entra directo.
  const trustedCustomerId = await getTrustedDeviceCustomerId();
  if (trustedCustomerId && trustedCustomerId === customer.id) {
    await createCustomerSession(customer.id, { ip, userAgent: ua });
    // Refrescamos la cookie de confianza (extiende otro año)
    await setTrustedDevice(customer.id);
    redirect('/tienda');
  }
  // ------------------------------------------

  const code = generateCode(6);
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000);

  await prisma.accessCode.create({
    data: { customerId: customer.id, code, expiresAt, ip },
  });

  await sendEmail({
    to: customer.email,
    subject: `Su código de acceso Lomhifar: ${code}`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#14503b;">Código de acceso</h2>
      <p style="margin:0 0 16px;line-height:1.6;">
        Hola, hemos recibido una solicitud de acceso a la plataforma B2B de Lomhifar
        para la farmacia <strong>${customer.pharmacyName}</strong>.
      </p>
      <p style="margin:0 0 8px;">Tu código de acceso es:</p>
      <div style="margin:16px 0;padding:18px;background:#f0faf5;border:1px solid #b7e6cf;border-radius:10px;text-align:center;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#14503b;font-family:monospace;">${code}</span>
      </div>
      <p style="margin:16px 0 0;color:#637787;font-size:13px;">
        Válido durante ${CODE_TTL_MIN} minutos. Si no has solicitado este acceso, ignora este correo.
      </p>
    `, { preheader: `Código ${code} para acceder a Lomhifar` }),
  });

  cookies().set(PENDING_COOKIE, customer.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CODE_TTL_MIN * 60,
  });

  redirect('/acceso/codigo');
}

export interface VerifyCodeState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function verifyAccessCode(
  _prev: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const code = String(formData.get('code') ?? '');
  const parsed = codeSchema.safeParse({ code });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe };
  }

  const customerId = cookies().get(PENDING_COOKIE)?.value;
  if (!customerId) {
    return { error: 'La sesión de acceso ha expirado. Vuelva a solicitar el código.' };
  }

  const codeRow = await prisma.accessCode.findFirst({
    where: {
      customerId,
      code: parsed.data.code,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!codeRow) {
    // marcar intentos en el código más reciente
    const last = await prisma.accessCode.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    if (last) {
      await prisma.accessCode.update({
        where: { id: last.id },
        data: { attempts: { increment: 1 } },
      });
    }
    return { error: 'Código no válido o expirado.' };
  }

  await prisma.accessCode.update({
    where: { id: codeRow.id },
    data: { consumedAt: new Date() },
  });

  const ua = headers().get('user-agent') ?? undefined;
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;
  await createCustomerSession(customerId, { ip, userAgent: ua });

  // Marca este navegador como confiable durante 1 año.
  // En el próximo login no se le pedirá código.
  await setTrustedDevice(customerId);

  cookies().delete(PENDING_COOKIE);
  redirect('/tienda');
}

export async function resendAccessCode(): Promise<{ ok: boolean; error?: string }> {
  const customerId = cookies().get(PENDING_COOKIE)?.value;
  if (!customerId) return { ok: false, error: 'Sesión expirada' };
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { ok: false, error: 'Cliente no encontrado' };

  const code = generateCode(6);
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000);
  await prisma.accessCode.create({ data: { customerId, code, expiresAt } });

  await sendEmail({
    to: customer.email,
    subject: `Nuevo código de acceso Lomhifar: ${code}`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#14503b;">Nuevo código de acceso</h2>
      <p style="margin:0 0 12px;">Ha solicitado un nuevo código. Use el siguiente:</p>
      <div style="margin:16px 0;padding:18px;background:#f0faf5;border:1px solid #b7e6cf;border-radius:10px;text-align:center;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#14503b;font-family:monospace;">${code}</span>
      </div>
      <p style="margin:0;color:#637787;font-size:13px;">Válido ${CODE_TTL_MIN} minutos.</p>
    `),
  });

  return { ok: true };
}
