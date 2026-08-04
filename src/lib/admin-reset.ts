import { prisma } from './prisma';

/**
 * Operaciones de RESET para "limpiar antes de pasar a producción".
 * Borran datos de prueba (pedidos, movimientos de stock, etc.) pero
 * NUNCA tocan configuraciones del admin: ni clientes, ni admins, ni
 * settings (precios, IVA, descuentos), ni imágenes, ni textos, ni
 * personas, ni áreas de impresión, ni el cartel.
 */

export interface ResetOrdersResult {
  ordersDeleted: number;
  itemsDeleted: number;
  stockRestored: { color: string; quantity: number }[];
  movementsDeleted: number;
}

/**
 * Borra TODOS los pedidos + sus líneas + los movimientos de stock que
 * generaron, restaurando el stock al nivel previo (sumando back los
 * decrementos). Los stock movements manuales (AJUSTE, COMPRA, etc.) NO
 * se tocan.
 *
 * La numeración de pedidos volverá a empezar desde 1001 en el próximo
 * pedido (porque el número es max+1).
 */
export async function resetAllOrders(): Promise<ResetOrdersResult> {
  return await prisma.$transaction(async (tx) => {
    // 1) Localizar movimientos de stock generados por pedidos (reason='PEDIDO')
    const movements = await tx.stockMovement.findMany({
      where: { reason: 'PEDIDO' },
      select: { id: true, stockId: true, delta: true },
    });

    // 2) Sumar deltas por stockId para restaurar (delta es negativo, restauramos
    //    sumando el valor absoluto)
    const restorePerStock = new Map<string, number>();
    for (const m of movements) {
      const cur = restorePerStock.get(m.stockId) ?? 0;
      restorePerStock.set(m.stockId, cur + Math.abs(m.delta));
    }

    // 3) Aplicar restauración al stock
    const stockRows = await tx.stock.findMany();
    const stockRestored: { color: string; quantity: number }[] = [];
    for (const stock of stockRows) {
      const restore = restorePerStock.get(stock.id) ?? 0;
      if (restore > 0) {
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: { increment: restore } },
        });
        stockRestored.push({ color: stock.color, quantity: restore });
      }
    }

    // 4) Borrar movimientos de tipo PEDIDO
    const movementsRes = await tx.stockMovement.deleteMany({
      where: { reason: 'PEDIDO' },
    });

    // 5) Contar items (Prisma cascade borrará automáticamente al borrar Order)
    const itemsCount = await tx.orderItem.count();

    // 6) Borrar todos los pedidos (cascade → OrderItem)
    const ordersRes = await tx.order.deleteMany({});

    return {
      ordersDeleted: ordersRes.count,
      itemsDeleted: itemsCount,
      stockRestored,
      movementsDeleted: movementsRes.count,
    };
  });
}

/**
 * Borra SOLO los pedidos marcados como prueba (isTest=true). No toca
 * el stock (los pedidos de prueba nunca lo descontaron) ni los pedidos
 * reales. Los LaserFile asociados se borran en cascada (onDelete:Cascade).
 * Operación segura para limpiar tras las pruebas antes del lanzamiento.
 */
export interface ResetTestOrdersResult {
  deleted: number;
}

export async function deleteTestOrders(): Promise<ResetTestOrdersResult> {
  const res = await prisma.order.deleteMany({ where: { isTest: true } });
  return { deleted: res.count };
}

export interface ResetApplicationsResult {
  deleted: number;
}

/**
 * Borra todas las solicitudes de alta de farmacia (rechazadas, pendientes y
 * aprobadas). NO toca los clientes ya activos en la tabla Customer.
 */
export async function resetAllApplications(): Promise<ResetApplicationsResult> {
  const res = await prisma.pharmacyApplication.deleteMany({});
  return { deleted: res.count };
}

export interface ResetSessionsResult {
  sessionsDeleted: number;
  codesDeleted: number;
}

/**
 * Borra TODAS las sesiones activas de clientes y los códigos de acceso
 * pendientes. Útil para forzar a todos los clientes a volver a iniciar
 * sesión antes de salir a producción.
 *
 * NOTA: las sesiones del propio admin no se tocan (están en otra tabla).
 */
export async function resetCustomerSessionsAndCodes(): Promise<ResetSessionsResult> {
  const [sessionsRes, codesRes] = await Promise.all([
    prisma.customerSession.deleteMany({}),
    prisma.accessCode.deleteMany({}),
  ]);
  return {
    sessionsDeleted: sessionsRes.count,
    codesDeleted: codesRes.count,
  };
}
