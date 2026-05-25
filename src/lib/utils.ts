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
  // Solo dígitos para fácil escritura
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

export function generateToken(): string {
  // 32 bytes hex
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
