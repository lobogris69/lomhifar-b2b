'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { parseCustomersExcel, type ParsedCustomerRow } from '@/lib/excel';

export interface ImportState {
  headerErrors?: string[];
  preview?: ParsedCustomerRow[];
  summary?: {
    total: number;
    created: number;
    updated: number;
    deactivated: number;
    skipped: number;
    elapsedMs: number;
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

/**
 * Importa masivamente con bulk operations.
 * Estrategia:
 *   1. Parsear Excel
 *   2. Filtrar filas válidas
 *   3. 1 sola query: obtener TODOS los CIFs ya existentes en BD
 *   4. Separar en "nuevos" vs "a actualizar"
 *   5. createMany(skipDuplicates) en bloques de 200
 *   6. updates individuales en paralelo, en bloques de 50
 *
 * Tiempo objetivo para 3000 filas: < 30s
 */
export async function commitImport(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const t0 = Date.now();
  const session = await getAdminSession();
  if (!session) return { error: 'No autorizado' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return { error: 'Adjunte el archivo Excel de nuevo para confirmar' };
  }
  const deactivateMissing = formData.get('deactivateMissing') === 'on';

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, headerErrors } = parseCustomersExcel(buffer);
  if (headerErrors.length) return { headerErrors, mode: 'preview' };

  const errors: { row: number; cif: string; msg: string }[] = [];
  let skipped = 0;

  // 1) Separar válidas / inválidas
  const validRows: ParsedCustomerRow[] = [];
  for (const row of rows) {
    if (row.errors.length) {
      errors.push({ row: row.rowNumber, cif: row.cif, msg: row.errors.join(', ') });
      skipped += 1;
      continue;
    }
    validRows.push(row);
  }

  // 2) Deduplicar por CIF (conservar la última ocurrencia)
  const byCif = new Map<string, ParsedCustomerRow>();
  for (const r of validRows) {
    if (byCif.has(r.cif)) {
      // Duplicado dentro del propio Excel: avisar pero sobrescribir
      errors.push({
        row: r.rowNumber,
        cif: r.cif,
        msg: 'CIF duplicado en el Excel (se queda la última ocurrencia)',
      });
    }
    byCif.set(r.cif, r);
  }
  const uniqueRows = Array.from(byCif.values());

  // 3) Obtener TODOS los existentes en 1 query
  const allCifs = uniqueRows.map((r) => r.cif);
  const existingList = await prisma.customer.findMany({
    where: { cif: { in: allCifs } },
    select: { cif: true, source: true },
  });
  const existingByCif = new Map(existingList.map((c) => [c.cif, c]));

  // 4) Separar nuevos vs actualizar
  const toCreate: ParsedCustomerRow[] = [];
  const toUpdate: ParsedCustomerRow[] = [];
  for (const r of uniqueRows) {
    if (existingByCif.has(r.cif)) toUpdate.push(r);
    else toCreate.push(r);
  }

  // 5) BULK createMany en chunks
  let created = 0;
  const CREATE_CHUNK = 200;
  for (let i = 0; i < toCreate.length; i += CREATE_CHUNK) {
    const chunk = toCreate.slice(i, i + CREATE_CHUNK);
    try {
      const r = await prisma.customer.createMany({
        data: chunk.map((row) => ({
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
        })),
        skipDuplicates: true,
      });
      created += r.count;
    } catch (e) {
      // Si createMany falla en bloque, hacemos fallback uno-a-uno para detectar el problema
      for (const row of chunk) {
        try {
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
        } catch (e2) {
          errors.push({
            row: row.rowNumber,
            cif: row.cif,
            msg: e2 instanceof Error ? e2.message.slice(0, 200) : 'Error al crear',
          });
          skipped += 1;
        }
      }
    }
  }

  // 6) Updates en paralelo por chunks
  let updated = 0;
  const UPDATE_CHUNK = 50;
  for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
    const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);
    const results = await Promise.allSettled(
      chunk.map((row) => {
        const existing = existingByCif.get(row.cif)!;
        return prisma.customer.update({
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
      }),
    );
    for (let k = 0; k < results.length; k += 1) {
      const r = results[k];
      const row = chunk[k];
      if (r.status === 'fulfilled') updated += 1;
      else {
        errors.push({
          row: row.rowNumber,
          cif: row.cif,
          msg: r.reason instanceof Error ? r.reason.message.slice(0, 200) : 'Error al actualizar',
        });
        skipped += 1;
      }
    }
  }

  // 7) Desactivar ausentes si se pidió
  let deactivated = 0;
  if (deactivateMissing) {
    const r = await prisma.customer.updateMany({
      where: {
        source: 'EXCEL',
        cif: { notIn: allCifs },
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
    summary: {
      total: rows.length,
      created,
      updated,
      deactivated,
      skipped,
      elapsedMs: Date.now() - t0,
      errors: errors.slice(0, 100),  // mostrar máx 100 para no saturar la respuesta
    },
  };
}
