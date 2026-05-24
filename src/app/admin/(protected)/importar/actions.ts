'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { parseCustomersExcel, type ParsedCustomerRow } from '@/lib/excel';

export interface ImportState {
  headerErrors?: string[];
  preview?: ParsedCustomerRow[];
  summary?: {
    created: number;
    updated: number;
    deactivated: number;
    skipped: number;
    errors: { row: number; cif: string; msg: string }[];
  };
  error?: string;
  mode?: 'preview' | 'committed';
}

export async function previewImport(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const session = await getAdminSession();
  if (!session) return { error: 'No autorizado' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Adjunte un archivo Excel' };

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, headerErrors } = parseCustomersExcel(buffer);

  if (headerErrors.length) {
    return { headerErrors, mode: 'preview' };
  }
  return { preview: rows, mode: 'preview' };
}

export async function commitImport(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const session = await getAdminSession();
  if (!session) return { error: 'No autorizado' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Adjunte el archivo Excel de nuevo para confirmar' };
  const deactivateMissing = formData.get('deactivateMissing') === 'on';

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, headerErrors } = parseCustomersExcel(buffer);
  if (headerErrors.length) return { headerErrors, mode: 'preview' };

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { row: number; cif: string; msg: string }[] = [];
  const importedCifs: string[] = [];

  for (const row of rows) {
    if (row.errors.length) {
      errors.push({ row: row.rowNumber, cif: row.cif, msg: row.errors.join(', ') });
      skipped += 1;
      continue;
    }
    try {
      const existing = await prisma.customer.findUnique({ where: { cif: row.cif } });
      if (existing) {
        await prisma.customer.update({
          where: { cif: row.cif },
          data: {
            email: row.email,
            pharmacyName: row.pharmacyName,
            contactName: row.contactName ?? null,
            phone: row.phone ?? null,
            whatsapp: row.whatsapp ?? null,
            address: row.address ?? null,
            city: row.city ?? null,
            postalCode: row.postalCode ?? null,
            province: row.province ?? null,
            bankAccount: row.bankAccount ?? null,
            notes: row.notes ?? null,
            active: row.active,
            source: existing.source === 'APPLICATION' ? 'APPLICATION' : 'EXCEL',
          },
        });
        updated += 1;
      } else {
        await prisma.customer.create({
          data: {
            cif: row.cif,
            email: row.email,
            pharmacyName: row.pharmacyName,
            contactName: row.contactName ?? null,
            phone: row.phone ?? null,
            whatsapp: row.whatsapp ?? null,
            address: row.address ?? null,
            city: row.city ?? null,
            postalCode: row.postalCode ?? null,
            province: row.province ?? null,
            bankAccount: row.bankAccount ?? null,
            notes: row.notes ?? null,
            active: row.active,
            source: 'EXCEL',
          },
        });
        created += 1;
      }
      importedCifs.push(row.cif);
    } catch (e) {
      errors.push({
        row: row.rowNumber,
        cif: row.cif,
        msg: e instanceof Error ? e.message : 'Error desconocido',
      });
      skipped += 1;
    }
  }

  let deactivated = 0;
  if (deactivateMissing) {
    const r = await prisma.customer.updateMany({
      where: {
        source: 'EXCEL',
        cif: { notIn: importedCifs },
        active: true,
      },
      data: { active: false },
    });
    deactivated = r.count;
  }

  revalidatePath('/admin/clientes');
  revalidatePath('/admin');

  return {
    mode: 'committed',
    summary: { created, updated, deactivated, skipped, errors },
  };
}
