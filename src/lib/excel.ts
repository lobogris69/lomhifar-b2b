import * as XLSX from 'xlsx';
import { normalizeCif, normalizeEmail } from './utils';

export interface ParsedCustomerRow {
  cif: string;
  email: string;
  pharmacyName: string;
  contactName?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  bankAccount?: string;
  notes?: string;
  active: boolean;
  rowNumber: number;
  errors: string[];
}

/**
 * Alias de cabeceras → campo del cliente.
 * Se compara normalizado: minúsculas, sin tildes, sin signos extra ni
 * sufijos numéricos (Email1, Correo Electrónico2, etc.).
 */
const HEADER_ALIASES: Record<string, string[]> = {
  cif: [
    'cif', 'nif', 'dni',
    'cif/nif', 'cif/dni', 'cif/dni/nie',
    'cif_nif', 'cif_dni',
    'cifnif', 'cifdni',
    'documento', 'documento identidad', 'doc',
  ],
  email: [
    'email', 'e-mail', 'mail',
    'correo', 'correo electronico', 'correo electronico1',
    'email1', 'mail1', 'correo1',
  ],
  pharmacyName: [
    'farmacia',
    'nombre',
    'nombre farmacia',
    'razon social',
    'razonsocial',
    'razon',
    'nombre comercial',
    'cliente',
    'denominacion',
  ],
  contactName: [
    'contacto', 'persona contacto', 'persona de contacto',
    'titular', 'responsable', 'nombre contacto',
  ],
  phone: [
    'telefono', 'tel', 'movil',
    'telefono1', 'tel1', 'telefonos',
  ],
  whatsapp: ['whatsapp', 'wasap', 'wsp', 'wa'],
  address: ['direccion', 'calle', 'domicilio', 'via'],
  city: [
    'localidad', 'ciudad', 'poblacion', 'municipio',
    'localidad/municipio', 'municipio/localidad',
  ],
  postalCode: [
    'cp', 'c.p.', 'codigo postal', 'codpostal', 'cod postal',
    'codigopostal', 'postal',
  ],
  province: ['provincia', 'prov'],
  bankAccount: ['iban', 'cuenta', 'cuenta bancaria', 'banco', 'ccc', 'numero cuenta'],
  notes: ['observaciones', 'notas', 'comentarios', 'observacion', 'comentario'],
  active: ['activo', 'activa', 'estado', 'baja', 'situacion'],
};

/**
 * Normaliza una cabecera para comparación:
 * - minúsculas
 * - sin tildes ni diéresis
 * - quita signos . , ; : / \ - _ ( ) [ ] " '
 * - colapsa espacios múltiples
 * - quita sufijo numérico al final ("email1" → "email")
 */
function normalizeHeader(h: string): string {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')        // quita tildes
    .replace(/[.,;:/\\\-_()[\]"']/g, ' ')   // signos → espacios
    .replace(/\s+/g, ' ')
    .replace(/\s*\d+\s*$/, '')              // quita sufijo numérico final
    .trim();
}

function buildHeaderMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((rawHeader, idx) => {
    const h = normalizeHeader(rawHeader);
    if (!h) return;
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (map[field] !== undefined) continue;
      const match = aliases.some((a) => normalizeHeader(a) === h);
      if (match) {
        map[field] = idx;
      }
    }
  });
  return map;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value == null) return true;
  const s = String(value).trim().toLowerCase();
  if (['no', 'false', 'inactivo', 'inactiva', '0', 'baja', 'cancelado', 'cancelada'].includes(s)) {
    return false;
  }
  return true;
}

function getCell(row: unknown[], idx: number | undefined): string | undefined {
  if (idx === undefined) return undefined;
  const v = row[idx];
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

/**
 * Detecta si una farmacia está dada de baja por el nombre
 * (típico en ERPs: "BAJA-FARMACIA …", "BAJA FARMACIA …")
 */
function looksLikeBaja(name: string): boolean {
  const trimmed = name.trim().toUpperCase();
  return /^BAJA[\s-]/.test(trimmed) || trimmed === 'BAJA';
}

export function parseCustomersExcel(buffer: Buffer | ArrayBuffer): {
  rows: ParsedCustomerRow[];
  headerErrors: string[];
  /** Cabeceras detectadas (para ayudar al admin a ver qué no se mapeó) */
  detectedHeaders: { raw: string; mapped: string | null }[];
} {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { rows: [], headerErrors: ['El archivo no contiene hojas'], detectedHeaders: [] };
  }
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  if (data.length < 2) {
    return {
      rows: [],
      headerErrors: ['El archivo está vacío o no tiene filas de datos'],
      detectedHeaders: [],
    };
  }

  const headers = (data[0] as unknown[]).map((h) => String(h ?? ''));
  const headerMap = buildHeaderMap(headers);

  const detectedHeaders = headers.map((raw, idx) => {
    const mapped = Object.entries(headerMap).find(([, i]) => i === idx)?.[0] ?? null;
    return { raw, mapped };
  });

  const headerErrors: string[] = [];
  // Solo CIF y nombre son OBLIGATORIOS para identificar al cliente.
  // El email es opcional: si no lo tiene, se importa como inactivo y el admin
  // lo activará desde el panel al añadir el email manualmente.
  if (headerMap.cif === undefined) headerErrors.push('Falta columna CIF/NIF/DNI');
  if (headerMap.pharmacyName === undefined)
    headerErrors.push('Falta columna Nombre de farmacia / Razón social');

  const rows: ParsedCustomerRow[] = [];

  for (let i = 1; i < data.length; i += 1) {
    const row = data[i] as unknown[];
    if (!row || row.every((c) => c === '' || c == null)) continue;

    const cifRaw = getCell(row, headerMap.cif);
    const emailRaw = getCell(row, headerMap.email);
    const pharmacyName = getCell(row, headerMap.pharmacyName);

    const errors: string[] = [];
    if (!cifRaw) errors.push('CIF/NIF vacío');
    if (!pharmacyName) errors.push('Nombre de farmacia vacío');
    // Email NO se considera error bloqueante. Si no lo tiene → cliente inactivo
    // pero igualmente importado para que el admin pueda editarlo después.

    // Activo si: campo activo OK + nombre no es "BAJA-" + tiene email
    const explicitActive = parseBoolean(getCell(row, headerMap.active));
    const nameSuggestsBaja = pharmacyName ? looksLikeBaja(pharmacyName) : false;
    const hasEmail = !!emailRaw;
    const active = explicitActive && !nameSuggestsBaja && hasEmail;

    rows.push({
      cif: cifRaw ? normalizeCif(cifRaw) : '',
      email: emailRaw ? normalizeEmail(emailRaw) : '',
      pharmacyName: pharmacyName ?? '',
      contactName: getCell(row, headerMap.contactName),
      phone: getCell(row, headerMap.phone),
      whatsapp: getCell(row, headerMap.whatsapp),
      address: getCell(row, headerMap.address),
      city: getCell(row, headerMap.city),
      postalCode: getCell(row, headerMap.postalCode),
      province: getCell(row, headerMap.province),
      bankAccount: getCell(row, headerMap.bankAccount)?.toUpperCase().replace(/[\s-]/g, ''),
      notes: getCell(row, headerMap.notes),
      active,
      rowNumber: i + 1,
      errors,
    });
  }

  return { rows, headerErrors, detectedHeaders };
}
