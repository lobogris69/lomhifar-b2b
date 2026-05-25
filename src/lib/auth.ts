import { cookies } from 'next/headers';
import { sealData, unsealData } from 'iron-session';
import { prisma } from './prisma';
import { generateToken } from './utils';

const ADMIN_COOKIE = 'lomhifar_admin';
const CUSTOMER_COOKIE = 'lomhifar_session';
const TRUSTED_DEVICE_COOKIE = 'lomhifar_trusted_device';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'INSECURE-DEV-ONLY-SESSION-SECRET-CHANGE-ME-PLEASE-32CHARS';

if (SESSION_SECRET.length < 32 && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET debe tener al menos 32 caracteres en producción');
}

const ADMIN_TTL = 60 * 60 * 8; // 8 horas
const CUSTOMER_TTL = 60 * 60 * 24 * 90; // 90 días (rolling — se refresca en cada acceso)
const TRUSTED_DEVICE_TTL = 60 * 60 * 24 * 365; // 1 año
// Umbral para refrescar la sesión: si quedan < 30 días, la extendemos al
// volver a 90 días. Evita un write por cada request.
const REFRESH_THRESHOLD_MS = 60 * 60 * 24 * 30 * 1000;

// ============================================================
// Admin session (cookie firmada con iron-session)
// ============================================================

export interface AdminSessionData {
  id: string;
  email: string;
  name?: string;
  role: string;  // SUPER_ADMIN | ADMIN | ORDER_MANAGER
  mustChangePassword?: boolean;
  iat: number;
}

export async function createAdminSession(admin: {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  mustChangePassword?: boolean;
}) {
  const payload: AdminSessionData = {
    id: admin.id,
    email: admin.email,
    name: admin.name ?? undefined,
    role: admin.role,
    mustChangePassword: admin.mustChangePassword ?? false,
    iat: Date.now(),
  };
  const sealed = await sealData(payload, {
    password: SESSION_SECRET,
    ttl: ADMIN_TTL,
  });
  cookies().set(ADMIN_COOKIE, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_TTL,
  });
}

export async function getAdminSession(): Promise<AdminSessionData | null> {
  const cookie = cookies().get(ADMIN_COOKIE);
  if (!cookie?.value) return null;
  try {
    const data = await unsealData<AdminSessionData>(cookie.value, {
      password: SESSION_SECRET,
      ttl: ADMIN_TTL,
    });
    return data;
  } catch {
    return null;
  }
}

export function destroyAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}

// ============================================================
// Customer session (token persistido en BD)
// ============================================================

export async function createCustomerSession(
  customerId: string,
  meta: { ip?: string; userAgent?: string },
) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + CUSTOMER_TTL * 1000);
  await prisma.customerSession.create({
    data: { customerId, token, expiresAt, ip: meta.ip, userAgent: meta.userAgent },
  });
  cookies().set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CUSTOMER_TTL,
  });
}

export async function getCustomerSession() {
  const cookie = cookies().get(CUSTOMER_COOKIE);
  if (!cookie?.value) return null;
  const session = await prisma.customerSession.findUnique({
    where: { token: cookie.value },
    include: { customer: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.customerSession.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }
  if (!session.customer.active) return null;

  // Sesión rolling: si queda menos de REFRESH_THRESHOLD (30 días), la
  // refrescamos a 90 días y re-emitimos la cookie con maxAge ampliado.
  // Esto evita el escritura por cada request pero mantiene la sesión
  // viva mientras el cliente entre con regularidad.
  const remainingMs = session.expiresAt.getTime() - Date.now();
  if (remainingMs < REFRESH_THRESHOLD_MS) {
    const newExpiry = new Date(Date.now() + CUSTOMER_TTL * 1000);
    await prisma.customerSession
      .update({
        where: { id: session.id },
        data: { expiresAt: newExpiry },
      })
      .catch(() => null);
    try {
      cookies().set(CUSTOMER_COOKIE, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: CUSTOMER_TTL,
      });
    } catch {
      // cookies().set puede fallar fuera de Server Action / Route Handler;
      // si pasa, simplemente no refrescamos la cookie (la BD ya está actualizada
      // y se intentará de nuevo en la próxima request).
    }
  }

  return session;
}

export async function destroyCustomerSession() {
  const cookie = cookies().get(CUSTOMER_COOKIE);
  if (cookie?.value) {
    await prisma.customerSession
      .delete({ where: { token: cookie.value } })
      .catch(() => null);
  }
  cookies().delete(CUSTOMER_COOKIE);
  // Al hacer logout explícito también borramos el "dispositivo de confianza"
  // para evitar sorpresas (si el usuario cierra sesión es porque NO quiere
  // entrar automáticamente la próxima vez).
  cookies().delete(TRUSTED_DEVICE_COOKIE);
}

// ============================================================
// "Dispositivo de confianza" — cookie firmada con iron-session
// Una vez el cliente ha verificado un código por email, marcamos este
// navegador como confiable durante 1 año. En logins posteriores, si el
// CIF + email coinciden con el customerId guardado en la cookie, NO
// pedimos código de nuevo — entra directamente.
// ============================================================

interface TrustedDevicePayload {
  customerId: string;
  iat: number;
}

export async function setTrustedDevice(customerId: string): Promise<void> {
  const payload: TrustedDevicePayload = { customerId, iat: Date.now() };
  const sealed = await sealData(payload, {
    password: SESSION_SECRET,
    ttl: TRUSTED_DEVICE_TTL,
  });
  cookies().set(TRUSTED_DEVICE_COOKIE, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TRUSTED_DEVICE_TTL,
  });
}

export async function getTrustedDeviceCustomerId(): Promise<string | null> {
  const cookie = cookies().get(TRUSTED_DEVICE_COOKIE);
  if (!cookie?.value) return null;
  try {
    const data = await unsealData<TrustedDevicePayload>(cookie.value, {
      password: SESSION_SECRET,
      ttl: TRUSTED_DEVICE_TTL,
    });
    return data?.customerId ?? null;
  } catch {
    return null;
  }
}
