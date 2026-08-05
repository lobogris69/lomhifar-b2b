import { redirect } from 'next/navigation';
import { Wrench, Shield, AlertTriangle } from 'lucide-react';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Alert } from '@/components/ui/Alert';
import { ResetCard } from './ResetCard';
import { TestOrdersCard } from './TestOrdersCard';
import { resetOrdersAction, resetApplicationsAction, resetSessionsAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sistema / Reset · Admin Lomhifar' };

export default async function SistemaPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  // Solo SUPER_ADMIN puede ver esta página
  if (session.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-4xl">
        <Alert variant="danger">
          <strong>Acceso restringido.</strong> Esta sección solo es accesible para usuarios
          con rol SUPER_ADMIN. Tu rol actual es {session.role}.
        </Alert>
      </div>
    );
  }

  // Contar elementos actuales (resiliente a fallos)
  let counts = { orders: 0, items: 0, applications: 0, sessions: 0, codes: 0, customers: 0, testOrders: 0 };
  try {
    const [orders, items, applications, sessions, codes, customers, testOrders] = await Promise.all([
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.pharmacyApplication.count(),
      prisma.customerSession.count(),
      prisma.accessCode.count(),
      prisma.customer.count(),
      prisma.order.count({ where: { isTest: true } }),
    ]);
    counts = { orders, items, applications, sessions, codes, customers, testOrders };
  } catch {
    // si falla, mostramos 0s
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
          <Wrench className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Sistema · Reset previo a producción</h1>
          <p className="section-subtitle">
            Borra los datos de prueba (pedidos, solicitudes, sesiones) sin afectar
            a tus clientes ni a la configuración del sitio.
          </p>
        </div>
      </div>

      {/* Aviso muy visible: qué se conserva */}
      <div className="card p-6 mb-6 border-l-4 border-emerald-500 bg-emerald-50/40">
        <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          ¿Qué se CONSERVA siempre?
        </h2>
        <p className="text-sm text-emerald-900/80 mt-1">
          Tus configuraciones de admin <strong>NO se tocan</strong> por ninguna acción
          de esta página:
        </p>
        <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-emerald-900">
          <div>âœ“ Todos los clientes (farmacias) — {counts.customers}</div>
          <div>âœ“ Usuarios admin y sus contraseñas</div>
          <div>âœ“ Precios, IVA, recargo, descuentos por volumen</div>
          <div>âœ“ Modo de portes y umbral de portes gratis</div>
          <div>âœ“ Imágenes del sitio (logo, fotos, cartel)</div>
          <div>âœ“ Textos del sitio (todos los slots editables)</div>
          <div>âœ“ Personas / casos de uso configurados</div>
          <div>âœ“ Áreas de impresión del configurador</div>
          <div>âœ“ PVP recomendado al paciente</div>
          <div>âœ“ Niveles de stock actuales (se restauran si borras pedidos)</div>
        </div>
      </div>

      <Alert variant="warning" className="mb-8">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Acciones irreversibles.</strong> Una vez confirmada cada acción los
            datos NO pueden recuperarse. Se recomienda usar esta página solo justo
            antes del lanzamiento a producción real, cuando estés seguro de que
            quieres descartar todas las pruebas.
          </div>
        </div>
      </Alert>

      {/* Borrado SEGURO de pedidos de prueba (sin escribir BORRAR) */}
      <div className="mb-8">
        <TestOrdersCard count={counts.testOrders} />
      </div>

      <div className="space-y-5">
        {/* 1. Pedidos */}
        <ResetCard
          title={`Borrar TODOS los pedidos (${counts.orders} actualmente · ${counts.items} líneas)`}
          description="Elimina todos los pedidos realizados hasta ahora, sus líneas y los movimientos de stock que generaron. La numeración volverá a empezar desde el siguiente número configurado (típicamente #1001)."
          bullets={[
            `${counts.orders} pedidos + ${counts.items} líneas de pedido`,
            'Movimientos de stock generados por esos pedidos',
            'El stock se RESTAURA automáticamente sumando back las unidades decrementadas',
            'Los movimientos de stock manuales (AJUSTE, COMPRA, DEVOLUCION) NO se tocan',
            'Las estadísticas (resumen, dashboard) quedan a cero hasta que entren pedidos reales',
          ]}
          buttonLabel="Borrar todos los pedidos"
          action={resetOrdersAction}
        />

        {/* 2. Solicitudes de alta */}
        <ResetCard
          title={`Borrar solicitudes de alta (${counts.applications} actualmente)`}
          description="Elimina todas las solicitudes de alta de farmacia (pendientes, aprobadas y rechazadas). NO afecta a los clientes que ya estén activos en la tabla de clientes."
          bullets={[
            `${counts.applications} solicitudes en cualquier estado`,
            'Útil para limpiar pruebas del formulario /solicitud',
            'NO toca a los clientes (farmacias) ya importadas o aprobadas',
          ]}
          buttonLabel="Borrar solicitudes"
          action={resetApplicationsAction}
        />

        {/* 3. Sesiones y códigos */}
        <ResetCard
          title={`Borrar sesiones y códigos de acceso (${counts.sessions} sesiones · ${counts.codes} códigos)`}
          description="Cierra TODAS las sesiones activas de clientes y borra los códigos de acceso emitidos. Todos los clientes tendrán que volver a iniciar sesión (CIF + email + nuevo código)."
          bullets={[
            `${counts.sessions} sesiones activas`,
            `${counts.codes} códigos de acceso de un solo uso`,
            'Tu sesión de admin NO se toca',
            'También se borran las cookies de "dispositivo de confianza" la próxima vez',
          ]}
          buttonLabel="Cerrar todas las sesiones"
          action={resetSessionsAction}
        />
      </div>

      <p className="mt-8 text-xs text-ink-500 text-center">
        Esta página solo es accesible para usuarios SUPER_ADMIN.
      </p>
    </div>
  );
}
