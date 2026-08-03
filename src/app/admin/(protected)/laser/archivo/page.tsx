import Link from 'next/link';
import { ArrowLeft, FolderClock, Info } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Histórico DXF · Admin Lomhifar' };

/**
 * Placeholder de la FASE 2: histórico de DXF generados, agrupado en
 * carpetas por fecha. Requiere modelo `LaserFile` en Prisma y guardar
 * cada DXF descargado desde /admin/pedidos/[id]. Se activará en el
 * siguiente incremento tras validar la Fase 1 (generador + descarga).
 */
export default async function LaserArchivePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/laser"
          className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a configuración láser
        </Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <FolderClock className="h-5 w-5" />
          </span>
          <div>
            <h1 className="section-title">Histórico de archivos láser</h1>
            <p className="section-subtitle">Todos los DXF generados, ordenados por fecha.</p>
          </div>
        </div>
      </div>

      <Alert variant="info" title="En desarrollo (Fase 2)">
        <p className="text-sm">
          Esta pantalla mostrará <strong>todos los DXF que hayas generado</strong>,
          agrupados en carpetas por fecha (📁 2026-08-03, 📁 2026-08-04…), con búsqueda por
          cliente y por texto grabado, y descarga individual o ZIP del día entero.
        </p>
        <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
          <li>Requiere modelo <code className="bg-ink-100 px-1 rounded text-xs">LaserFile</code> en base de datos</li>
          <li>Cada descarga desde <code className="bg-ink-100 px-1 rounded text-xs">/admin/pedidos/[id]</code> queda registrada aquí</li>
          <li>Se activa en el próximo incremento tras validar el generador de la Fase 1</li>
        </ul>
        <p className="mt-2 text-sm">
          <Info className="h-3 w-3 inline mr-1" />
          Mientras tanto, cuando descargues un DXF desde un pedido, el nombre del archivo
          incluye la fecha y el nombre del cliente para que puedas organizarlo en carpetas
          tú mismo en tu PC.
        </p>
      </Alert>
    </div>
  );
}
