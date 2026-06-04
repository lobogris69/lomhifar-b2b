import { redirect } from 'next/navigation';
import { Wrench, Shield, AlertTriangle } from 'lucide-react';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Alert } from '@/components/ui/Alert';
import { ResetCard } from './ResetCard';
import { resetOrdersAction, resetApplicationsAction, resetSessionsAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sistema / Reset Â· Admin Lomhifar' };

export default async function SistemaPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  // Solo SUPER_ADMIN puede ver esta pÃ¡gina
  if (session.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-4xl">
        <Alert variant="danger">
          <strong>Acceso restringido.</strong> Esta secciÃ³n solo es accesible para usuarios
          con rol SUPER_ADMIN. Tu rol actual es {session.role}.
        </Alert>
      </div>
    );
  }

  // Contar elementos actuales (resiliente a fallos)
  let counts = { orders: 0, items: 0, applications: 0, sessions: 0, codes: 0, customers: 0 };
  try {
    const [orders, items, applications, sessions, codes, customers] = await Promise.all([
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.pharmacyApplication.count(),
      prisma.customerSession.count(),
      prisma.accessCode.count(),
      prisma.customer.count(),
    ]);
    counts = { orders, items, applications, sessions, codes, customers };
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
          <h1 className="section-title">Sistema Â· Reset previo a producciÃ³n</h1>
          <p className="section-subtitle">
            Borra los datos de prueba (pedidos, solicitudes, sesiones) sin afectar
            a tus clientes ni a la configuraciÃ³n del sitio.
          </p>
        </div>
      </div>

      {/* Aviso muy visible: quÃ© se conserva */}
      <div className="card p-6 mb-6 border-l-4 border-emerald-500 bg-emerald-50/40">
        <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Â¿QuÃ© se CONSERVA siempre?
        </h2>
        <p className="text-sm text-emerald-900/80 mt-1">
          Tus configuraciones de admin <strong>NO se tocan</strong> por ninguna acciÃ³n
          de esta pÃ¡gina:
        </p>
        <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-emerald-900">
          <div>âœ“ Todos los clientes (farmacias) â€” {counts.customers}</div>
          <div>âœ“ Usuarios admin y sus contraseÃ±as</div>
          <div>âœ“ Precios, IVA, recargo, descuentos por volumen</div>
          <div>âœ“ Modo de portes y umbral de portes gratis</div>
          <div>âœ“ ImÃ¡genes del sitio (logo, fotos, cartel)</div>
          <div>âœ“ Textos del sitio (todos los slots editables)</div>
          <div>âœ“ Personas / casos de uso configurados</div>
          <div>âœ“ Ãreas de impresiÃ³n del configurador</div>
          <div>âœ“ PVP recomendado al paciente</div>
          <div>âœ“ Niveles de stock actuales (se restauran si borras pedidos)</div>
        </div>
      </div>

      <Alert variant="warning" className="mb-8">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Acciones irreversibles.</strong> Una vez confirmada cada acciÃ³n los
            datos NO pueden recuperarse. Se recomienda usar esta pÃ¡gina solo justo
            antes del lanzamiento a producciÃ³n real, cuando estÃ©s seguro de que
            quieres descartar todas las pruebas.
          </div>
        </div>
      </Alert>

      <div className="space-y-5">
        {/* 1. Pedidos */}
        <ResetCard
          title={`Borrar TODOS los pedidos (${counts.orders} actualmente Â· ${counts.items} lÃ­neas)`}
          description="Elimina todos los pedidos realizados hasta ahora, sus lÃ­neas y los movimientos de stock que generaron. La numeraciÃ³n volverÃ¡ a empezar desde el siguiente nÃºmero configurado (tÃ­picamente #1001)."
          bullets={[
            `${counts.orders} pedidos + ${counts.items} lÃ­neas de pedido`,
            'Movimientos de stock generados por esos pedidos',
            'El stock se RESTAURA automÃ¡ticamente sumando back las unidades decrementadas',
            'Los movimientos de stock manuales (AJUSTE, COMPRA, DEVOLUCION) NO se tocan',
            'Las estadÃ­sticas (resumen, dashboard) quedan a cero hasta que entren pedidos reales',
          ]}
          buttonLabel="Borrar todos los pedidos"
          action={resetOrdersAction}
        />

        {/* 2. Solicitudes de alta */}
        <ResetCard
          title={`Borrar solicitudes de alta (${counts.applications} actualmente)`}
          description="Elimina todas las solicitudes de alta de farmacia (pendientes, aprobadas y rechazadas). NO afecta a los clientes que ya estÃ©n activos en la tabla de clientes."
          bullets={[
            `${counts.applications} solicitudes en cualquier estado`,
            'Ãštil para limpiar pruebas del formulario /solicitud',
            'NO toca a los clientes (farmacias) ya importadas o aprobadas',
          ]}
          buttonLabel="Borrar solicitudes"
          action={resetApplicationsAction}
        />

        {/* 3. Sesiones y cÃ³digos */}
        <ResetCard
          title={`Borrar sesiones y cÃ³digos de acceso (${counts.sessions} sesiones Â· ${counts.codes} cÃ³digos)`}
          description="Cierra TODAS las sesiones activas de clientes y borra los cÃ³digos de acceso emitidos. Todos los clientes tendrÃ¡n que volver a iniciar sesiÃ³n (CIF + email + nuevo cÃ³digo)."
          bullets={[
            `${counts.sessions} sesiones activas`,
            `${counts.codes} cÃ³digos de acceso de un solo uso`,
            'Tu sesiÃ³n de admin NO se toca',
            'TambiÃ©n se borran las cookies de "dispositivo de confianza" la prÃ³xima vez',
          ]}
          buttonLabel="Cerrar todas las sesiones"
          action={resetSessionsAction}
        />
      </div>

      <p className="mt-8 text-xs text-ink-500 text-center">
        Esta pÃ¡gina solo es accesible para usuarios SUPER_ADMIN.
      </p>
    </div>
  );
}
