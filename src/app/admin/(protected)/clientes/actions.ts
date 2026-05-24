'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { normalizeCif, normalizeEmail } from '@/lib/utils';
import { isValidSpanishTaxId } from '@/lib/validations';

async function ensureAdmin() {
  const s = await getAdminSession();
  if (!s) redirect('/admin/login');
}

export async function toggleCustomerActive(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const c = await prisma.customer.findUnique({ where: { id } });
  if (!c) return;
  await prisma.customer.update({ where: { id }, data: { active: !c.active } });
  revalidatePath('/admin/clientes');
}

export async function deleteCustomer(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  await prisma.customer.delete({ where: { id } }).catch(() => null);
  revalidatePath('/admin/clientes');
}

/**
 * Eliminación masiva por IDs. Recibe FormData con ids[] múltiples.
 * Borra solo los que no tengan pedidos vinculados (los demás solo desactiva).
 */
export interface BulkDeleteState {
  ok?: boolean;
  deleted?: number;
  deactivatedInstead?: number;
  error?: string;
}

export async function bulkDeleteCustomers(
  _prev: BulkDeleteState,
  formData: FormData,
): Promise<BulkDeleteState> {
  await ensureAdmin();
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) return { error: 'No has seleccionado ningún cliente' };

  // Separar los que tienen pedidos (no se pueden borrar, solo desactivar)
  const withOrders = await prisma.order.findMany({
    where: { customerId: { in: ids } },
    select: { customerId: true },
    distinct: ['customerId'],
  });
  const protectedIds = new Set(withOrders.map((o) => o.customerId));
  const toDelete = ids.filter((id) => !protectedIds.has(id));
  const toDeactivate = ids.filter((id) => protectedIds.has(id));

  let deleted = 0;
  if (toDelete.length > 0) {
    const r = await prisma.customer.deleteMany({ where: { id: { in: toDelete } } });
    deleted = r.count;
  }
  let deactivatedInstead = 0;
  if (toDeactivate.length > 0) {
    const r = await prisma.customer.updateMany({
      where: { id: { in: toDeactivate } },
      data: { active: false },
    });
    deactivatedInstead = r.count;
  }

  revalidatePath('/admin/clientes');
  return { ok: true, deleted, deactivatedInstead };
}

export async function bulkDeactivateCustomers(
  _prev: BulkDeleteState,
  formData: FormData,
): Promise<BulkDeleteState> {
  await ensureAdmin();
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) return { error: 'No has seleccionado ningún cliente' };
  const r = await prisma.customer.updateMany({
    where: { id: { in: ids } },
    data: { active: false },
  });
  revalidatePath('/admin/clientes');
  return { ok: true, deleted: 0, deactivatedInstead: r.count };
}

export interface SaveCustomerState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function saveCustomer(
  _prev: SaveCustomerState,
  formData: FormData,
): Promise<SaveCustomerState> {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const data = {
    cif: normalizeCif(String(formData.get('cif') ?? '')),
    email: normalizeEmail(String(formData.get('email') ?? '')),
    pharmacyName: String(formData.get('pharmacyName') ?? '').trim(),
    contactName: String(formData.get('contactName') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '').trim() || null,
    whatsapp: String(formData.get('whatsapp') ?? '').trim() || null,
    address: String(formData.get('address') ?? '').trim() || null,
    city: String(formData.get('city') ?? '').trim() || null,
    postalCode: String(formData.get('postalCode') ?? '').trim() || null,
    province: String(formData.get('province') ?? '').trim() || null,
    bankAccount: String(formData.get('bankAccount') ?? '').trim().toUpperCase().replace(/[\s-]/g, '') || null,
    notes: String(formData.get('notes') ?? '').trim() || null,
    active: formData.get('active') === 'on',
  };
  const fe: Record<string, string> = {};
  if (!isValidSpanishTaxId(data.cif)) fe.cif = 'CIF/NIF/NIE no válido';
  if (!data.email.includes('@')) fe.email = 'Email no válido';
  if (data.pharmacyName.length < 2) fe.pharmacyName = 'Nombre obligatorio';
  if (Object.keys(fe).length) return { fieldErrors: fe };

  try {
    if (id) {
      await prisma.customer.update({ where: { id }, data: { ...data, source: 'MANUAL' } });
    } else {
      const exists = await prisma.customer.findUnique({ where: { cif: data.cif } });
      if (exists) return { error: 'Ya existe un cliente con ese CIF' };
      await prisma.customer.create({ data: { ...data, source: 'MANUAL' } });
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar' };
  }

  revalidatePath('/admin/clientes');
  redirect('/admin/clientes');
}
