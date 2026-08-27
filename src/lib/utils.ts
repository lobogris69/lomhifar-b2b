import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

/**
 * Formatea una fecha en hora ESPAÑOLA peninsular (Europe/Madrid).
 * Importante: el servidor de Railway corre en UTC, así que sin esta
 * opción las fechas aparecen 1h o 2h por detrás (DST en verano).
 */
// ============================================================
// Fechas en hora española
// ============================================================
//
// El servidor de Railway va en UTC y España va una o dos horas por delante.
// Como las fechas se ENSEÑAN en hora española (formatDate fuerza
// Europe/Madrid), filtrar por la del servidor descuadra: un pedido que la
// tabla muestra del día 27 a la 01:00 queda fuera de un filtro «del 27 al
// 27», y los pedidos de madrugada del día 1 se contaban en el mes anterior.

/** Minutos que Madrid va por delante de UTC en ese instante. */
function desfaseMadrid(momento: Date): number {
  const enMadrid = new Date(momento.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const enUtc = new Date(momento.toLocaleString('en-US', { timeZone: 'UTC' }));
  return Math.round((enMadrid.getTime() - enUtc.getTime()) / 60000);
}

/** Las 00:00 españolas de un 'YYYY-MM-DD', como instante real. */
export function inicioDelDiaEspanol(ymd: string): Date {
  const base = new Date(`${ymd}T00:00:00.000Z`);
  return new Date(base.getTime() - desfaseMadrid(base) * 60000);
}

/** Las 23:59:59.999 españolas de un 'YYYY-MM-DD'. */
export function finDelDiaEspanol(ymd: string): Date {
  const base = new Date(`${ymd}T23:59:59.999Z`);
  return new Date(base.getTime() - desfaseMadrid(base) * 60000);
}

/** Las 00:00 españolas del día 1 del mes en curso. */
export function inicioDelMesEspanol(): Date {
  return inicioDelDiaEspanol(mesEspanol(new Date()) + '-01');
}

/** Clave 'YYYY-MM' del mes al que pertenece esa fecha en España. */
export function mesEspanol(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
  }).format(fecha).slice(0, 7);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(d);
}

/** Versión solo fecha (sin hora), también en zona horaria española. */
export function formatDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(d);
}

export function normalizeCif(cif: string): string {
  return cif.trim().toUpperCase().replace(/[\s\-_.]/g, '');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateCode(length = 6): string {
  // Solo dígitos, para que sea fácil de teclear al dictado por teléfono.
  //
  // Con Math.random() la secuencia es predecible a partir de unos cuantos
  // códigos observados, y esto es lo único que protege la cuenta de una
  // farmacia. Mismo generador que los tokens de sesión.
  //
  // El módulo 10 sobre 0-255 favorecería un poco los dígitos bajos; se
  // descartan los valores que sobran para que los diez salgan igual.
  const out: string[] = [];
  const buf = new Uint8Array(length * 2);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < 250) {
        out.push(String(b % 10));
        if (out.length === length) break;
      }
    }
  }
  return out.join('');
}

export function generateToken(): string {
  // 32 bytes hex
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
