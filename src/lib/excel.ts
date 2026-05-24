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

const HEADER_ALIASES: Record<string, string[]> = {
  cif: ['cif', 'nif', 'cif/nif', 'cif_nif', 'cifnif', 'documento'],
  email: ['email', 'correo', 'e-mail', 'mail', 'correo electronico', 'correo electrónico'],
  pharmacyName: [
    'farmacia',
    'nombre',
    'nombre farmacia',
    'razon social',
    'razón social',
    'razonsocial',
    'nombre comercial',
  ],
  contactName: ['contacto', 'persona contacto', 'titular', 'persona de contacto'],
  phone: ['telefono', 'teléfono', 'tel', 'movil', 'móvil'],
  whatsapp: ['whatsapp', 'wasap', 'wsp', 'wa'],
  address: ['direccion', 'dirección', 'calle', 'domicilio'],
  city: ['localidad', 'ciudad', 'poblacion', 'población'],
  postalCode: ['cp', 'c.p.', 'codigo postal', 'código postal', 'codpostal', 'cod postal'],
  province: ['provincia'],
  bankAccount: ['iban', 'cuenta', 'cuenta bancaria', 'banco', 'ccc'],
  notes: ['observaciones', 'notas', 'comentarios'],
  active: ['activo', 'activa', 'estado'],
};

function normalizeHeader(h: string): string {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function buildHeaderMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((rawHeader, idx) => {
    const h = normalizeHeader(rawHeader);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((a) => normalizeHeader(a) === h)) {
        if (map[field] === undefined) map[field] = idx;
      }
    }
  });
  return map;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value == null) return true;
  const s = String(value).trim().toLowerCase();
  if (['no', 'false', 'inactivo', 'inactiva', '0', 'baja'].includes(s)) return false;
  return true;
}

function getCell(row: unknown[], idx: number | undefined): string | undefined {
  if (idx === undefined) return undefined;
  const v = row[idx];
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

export function parseCustomersExcel(buffer: Buffer | ArrayBuffer): {
  rows: ParsedCustomerRow[];
  headerErrors: string[];
} {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { rows: [], headerErrors: ['El archivo no contiene hojas'] };
  }
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  if (data.length < 2) {
    return { rows: [], headerErrors: ['El archivo está vacío o no tiene filas de datos'] };
  }

  const headers = (data[0] as unknown[]).map((h) => String(h ?? ''));
  const headerMap = buildHeaderMap(headers);

  const headerErrors: string[] = [];
  if (headerMap.cif === undefined) headerErrors.push('Falta columna CIF/NIF');
  if (headerMap.email === undefined) headerErrors.push('Falta columna Email');
  if (headerMap.pharmacyName === undefined)
    headerErrors.push('Falta columna Nombre de farmacia');

  const rows: ParsedCustomerRow[] = [];

  for (let i = 1; i < data.length; i += 1) {
    const row = data[i] as unknown[];
    if (!row || row.every((c) => c === '' || c == null)) continue;

    const cifRaw = getCell(row, headerMap.cif);
    const emailRaw = getCell(row, headerMap.email);
    const pharmacyName = getCell(row, headerMap.pharmacyName);

    const errors: string[] = [];
    if (!cifRaw) errors.push('CIF/NIF vacío');
    if (!emailRaw) errors.push('Email vacío');
    if (!pharmacyName) errors.push('Nombre de farmacia vacío');

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
      active: parseBoolean(getCell(row, headerMap.active)),
      rowNumber: i + 1,
      errors,
    });
  }

  return { rows, headerErrors };
}
