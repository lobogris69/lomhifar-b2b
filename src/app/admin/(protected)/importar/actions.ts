'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { parseCustomersExcel, type ParsedCustomerRow } from '@/lib/excel';

export interface ImportState {
  headerErrors?: string[];
  preview?: ParsedCustomerRow[];
  summary?: {
    total: number;
    created: number;
    updated: number;
    deactivated: number;
    /** Por qué no se desactivó a nadie, si se pidió y no se hizo. */
    deactivationSkipped?: string;
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
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  await requireAdmin({ write: true, permission: 'CUSTOMERS_WRITE' });

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
  // Bloquea VIEWER (rol de solo lectura) automáticamente.
  await requireAdmin({ write: true, permission: 'CUSTOMERS_WRITE' });

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
  //
  // «Ausente» tiene que significar «no viene en el fichero», y antes
  // significaba «no viene entre las filas que pudimos leer». Una farmacia con
  // el email mal escrito salía de la lista y se quedaba sin acceso a la web
  // aunque estuviera en el Excel. Aquí se cuenta el CIF de TODAS las filas,
  // buenas y malas.
  //
  // Y si el fichero no trae ninguna fila aprovechable —columnas cambiadas,
  // fichero equivocado— no se desactiva nada: `notIn: []` casa con todo y
  // dejaría a la cartera entera sin acceso de una tacada.
  let deactivated = 0;
  let deactivationSkipped: string | undefined;
  if (deactivateMissing) {
    const cifsDelFichero = Array.from(
      new Set(rows.map((r) => r.cif).filter((c): c is string => Boolean(c))),
    );

    if (uniqueRows.length === 0) {
      deactivationSkipped =
        'No se ha desactivado a nadie: el archivo no traía ninguna fila aprovechable. ' +
        'Revisa que sea el Excel correcto.';
    } else {
      const r = await prisma.customer.updateMany({
        where: {
          source: 'EXCEL',
          cif: { notIn: cifsDelFichero },
          active: true,
        },
        data: { active: false },
      });
      deactivated = r.count;
    }
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
      deactivationSkipped,
      skipped,
      elapsedMs: Date.now() - t0,
      errors: errors.slice(0, 100),  // mostrar máx 100 para no saturar la respuesta
    },
  };
}
