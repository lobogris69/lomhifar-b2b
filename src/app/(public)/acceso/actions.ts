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

// Intentos fallidos que se le consienten a un código antes de quemarlo.
// Sin esto, un código de 6 dígitos se acaba adivinando probando: son solo
// un millón de combinaciones y nadie estaba contando los fallos.
const INTENTOS_MAX = 5;

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
  // sesión directamente. Candado de seguridad: SOLO fuera de producción,
  // aunque la variable esté puesta por error en Railway, en producción se
  // ignora y siempre se exige el código por email (control de acceso real).
  if (
    process.env.PREVIEW_BYPASS_CODE === 'true' &&
    process.env.NODE_ENV !== 'production'
  ) {
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

  // -------- ACCESO DEMO PARA COMERCIALES --------
  // Cuentas de PRUEBA (isTest): si hay una clave demo configurada
  // (DEMO_ACCESS_CODE), NO se manda código por email —nadie tiene ese buzón—.
  // Se pasa directamente a la pantalla del código, donde los comerciales meten
  // la clave fija compartida. SOLO afecta a cuentas isTest; los clientes reales
  // siguen recibiendo su código por email como siempre.
  if ((process.env.DEMO_ACCESS_CODE ?? '').trim() && customer.isTest) {
    cookies().set(PENDING_COOKIE, customer.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: CODE_TTL_MIN * 60,
    });
    redirect('/acceso/codigo');
  }
  // ----------------------------------------------

  // Pedir código empieza de cero: los anteriores dejan de valer, con sus
  // intentos fallidos. Si no, quien pide un código nuevo se lleva de regalo
  // el contador gastado del anterior y se queda fuera sin motivo.
  await prisma.accessCode.updateMany({
    where: { customerId: customer.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateCode(6);
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000);

  await prisma.accessCode.create({
    data: { customerId: customer.id, code, expiresAt, ip },
  });

  try {
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
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[acceso] no se pudo enviar el código de acceso:', e);
  }

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

  // -------- CLAVE DEMO PARA COMERCIALES --------
  // Si la clave introducida coincide con DEMO_ACCESS_CODE y la cuenta es de
  // PRUEBA (isTest), se entra directamente. Es reutilizable (no se consume) y
  // no está sujeta al bloqueo por intentos: es la clave compartida de los
  // comerciales para trastear. NUNCA aplica a clientes reales (no son isTest).
  const demoCode = (process.env.DEMO_ACCESS_CODE ?? '').trim();
  if (demoCode && parsed.data.code === demoCode) {
    const cust = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { isTest: true, active: true },
    });
    if (cust?.isTest && cust.active) {
      const ua = headers().get('user-agent') ?? undefined;
      const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;
      await createCustomerSession(customerId, { ip, userAgent: ua });
      await setTrustedDevice(customerId);
      cookies().delete(PENDING_COOKIE);
      redirect('/tienda');
    }
  }
  // ---------------------------------------------

  // El campo `attempts` ya existía y se incrementaba, pero no lo leía nadie:
  // se podía probar un código detrás de otro indefinidamente.
  const ultimo = await prisma.accessCode.findFirst({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });

  if (ultimo && ultimo.attempts >= INTENTOS_MAX) {
    return {
      error: 'Demasiados intentos fallidos. Pide un código nuevo desde el principio.',
    };
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
    if (ultimo) {
      await prisma.accessCode.update({
        where: { id: ultimo.id },
        data: { attempts: { increment: 1 } },
      });
    }
    const quedan = ultimo ? INTENTOS_MAX - (ultimo.attempts + 1) : INTENTOS_MAX;
    return {
      error: quedan > 0
        ? `Código no válido o expirado. Te quedan ${quedan} ${quedan === 1 ? 'intento' : 'intentos'}.`
        : 'Código no válido. Se han agotado los intentos: pide un código nuevo.',
    };
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

  // Un código nuevo invalida los anteriores. Si no, se van acumulando
  // códigos válidos a la vez y cada reenvío hace más fácil acertar.
  await prisma.accessCode.updateMany({
    where: { customerId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateCode(6);
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000);
  await prisma.accessCode.create({ data: { customerId, code, expiresAt } });

  try {
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
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[acceso] no se pudo reenviar el código:', e);
    return { ok: false, error: 'No se pudo enviar el email. Inténtalo de nuevo en un momento.' };
  }

  return { ok: true };
}
