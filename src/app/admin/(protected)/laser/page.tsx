import Link from 'next/link';
import { Zap, FolderClock, ExternalLink } from 'lucide-react';
import { getLaserSettings } from '@/lib/laser';
import { getLaserProfiles } from '@/lib/laser-profiles';
import { LaserSettingsForm } from './LaserSettingsForm';
import { LaserProfilesForm } from './LaserProfilesForm';
import { ClaveDelPuente } from './ClaveDelPuente';
import { claveDelPuente } from '@/lib/laser-cola';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/admin-roles';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configuración Láser · Admin Lomhifar' };

export default async function LaserSettingsPage() {
  const s = await getLaserSettings();
  const perfiles = await getLaserProfiles();

  // La clave del puente no es informativa: con ella se escribe en
  // /api/laser/** sin sesión —marcar trabajos como grabados, devolverlos a la
  // cola— y aquí salía entera en pantalla. Un Supervisor, que es de solo
  // lectura, la veía y con ella podía escribir. Solo la ven los roles que de
  // verdad pueden tocar la configuración.
  const sesion = await getAdminSession();
  const puedeVerla = sesion ? hasPermission(sesion.role, 'CONFIG_WRITE') : false;
  const clave = puedeVerla ? await claveDelPuente() : '';

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <h1 className="section-title">Configuración de grabado láser</h1>
            <p className="section-subtitle">
              Área imprimible de la placa, márgenes y tipografía. Los cambios afectan
              a los DXF que se generen a partir de ahora.
            </p>
          </div>
        </div>
        <Link
          href="/admin/laser/archivo"
          className="btn-secondary text-sm shrink-0"
        >
          <FolderClock className="h-4 w-4" /> Ver histórico de archivos
        </Link>
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-ink-700 flex items-start gap-2">
        <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-brand-700" />
        <div>
          <strong>Formato DXF</strong> compatible con EZCAD (láser de fibra JCZ).
          El origen (0,0) queda en la <strong>esquina inferior izquierda</strong> de la placa
          y todas las coordenadas van en <strong>milímetros</strong>. Si en EZCAD tienes
          «Origen del puntero» configurado en la esquina inferior izquierda, al importar
          el DXF el texto queda perfectamente centrado en la placa.
        </div>
      </div>

      <LaserSettingsForm
        initialValues={{
          plateWidthMm: s.plateWidthMm,
          plateHeightMm: s.plateHeightMm,
          marginLeftMm: s.marginLeftMm,
          marginRightMm: s.marginRightMm,
          marginTopMm: s.marginTopMm,
          marginBottomMm: s.marginBottomMm,
          lineHeightFactor: s.lineHeightFactor,
          curveSteps: s.curveSteps,
        }}
      />

      <div className="pt-2">
        <h2 className="section-title text-lg">Perfiles de grabado por material</h2>
        <p className="section-subtitle mb-4">
          Potencia, velocidad, pasadas y frecuencia de la máquina. Cada material se
          comporta distinto, así que van por perfil: al probar uno nuevo se crea su
          perfil sin tocar los que ya están afinados.
        </p>
        <LaserProfilesForm config={perfiles} />
      </div>

      <div className="pt-2">
        {puedeVerla && <ClaveDelPuente claveActual={clave} />}
      </div>
    </div>
  );
}
