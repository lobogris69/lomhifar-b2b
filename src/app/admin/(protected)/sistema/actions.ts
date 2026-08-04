'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import {
  resetAllOrders,
  resetAllApplications,
  resetCustomerSessionsAndCodes,
  deleteTestOrders,
  type ResetOrdersResult,
  type ResetApplicationsResult,
  type ResetSessionsResult,
  type ResetTestOrdersResult,
} from '@/lib/admin-reset';

const CONFIRMATION_WORD = 'BORRAR';

export interface ResetState {
  error?: string;
  ok?: boolean;
  ordersResult?: ResetOrdersResult;
  applicationsResult?: ResetApplicationsResult;
  sessionsResult?: ResetSessionsResult;
  testOrdersResult?: ResetTestOrdersResult;
}

/**
 * Borra SOLO los pedidos de prueba. Operación SEGURA (no toca stock ni
 * pedidos reales) → no requiere escribir la palabra de confirmación.
 */
export async function deleteTestOrdersAction(
  _prev: ResetState,
  _formData: FormData,
): Promise<ResetState> {
  try {
    await checkAccess();
    const result = await deleteTestOrders();
    revalidatePath('/admin');
    revalidatePath('/admin/pedidos');
    revalidatePath('/admin/sistema');
    return { ok: true, testOrdersResult: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al borrar pedidos de prueba' };
  }
}

async function checkAccess(): Promise<void> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'SUPER_ADMIN') {
    throw new Error('Solo SUPER_ADMIN puede ejecutar operaciones de reset');
  }
}

function checkConfirmation(formData: FormData): string | null {
  const word = String(formData.get('confirm') ?? '').trim().toUpperCase();
  if (word !== CONFIRMATION_WORD) {
    return `Para confirmar, escribe exactamente "${CONFIRMATION_WORD}" en el campo de confirmación.`;
  }
  return null;
}

/** Borra todos los pedidos + restaura stock + limpia movimientos PEDIDO. */
export async function resetOrdersAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  try {
    await checkAccess();
    const err = checkConfirmation(formData);
    if (err) return { error: err };

    const result = await resetAllOrders();
    revalidatePath('/admin');
    revalidatePath('/admin/pedidos');
    revalidatePath('/admin/sistema');
    return { ok: true, ordersResult: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al borrar pedidos' };
  }
}

/** Borra todas las solicitudes de alta (PENDING/APPROVED/REJECTED). */
export async function resetApplicationsAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  try {
    await checkAccess();
    const err = checkConfirmation(formData);
    if (err) return { error: err };

    const result = await resetAllApplications();
    revalidatePath('/admin/solicitudes');
    revalidatePath('/admin/sistema');
    return { ok: true, applicationsResult: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al borrar solicitudes' };
  }
}

/** Borra todas las sesiones activas y códigos de acceso. */
export async function resetSessionsAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  try {
    await checkAccess();
    const err = checkConfirmation(formData);
    if (err) return { error: err };

    const result = await resetCustomerSessionsAndCodes();
    revalidatePath('/admin/sistema');
    return { ok: true, sessionsResult: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al borrar sesiones' };
  }
}
