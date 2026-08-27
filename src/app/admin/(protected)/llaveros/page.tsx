import { KeyRound } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { IndicadorGrabadora } from '@/components/laser/IndicadorGrabadora';
import { AvisoDePedal } from '@/components/laser/AvisoDePedal';
import { getPerfilesLlavero, getVentanaLlavero } from '@/lib/llaveros';
import { SubirDiseno } from './SubirDiseno';
import { FichaDiseno, type DisenoLite } from './FichaDiseno';
import { AjustesLlavero } from './AjustesLlavero';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Llaveros · Admin Lomhifar' };

const ULTIMOS = 20;

export default async function LlaverosPage() {
  const [ventana, perfiles, disenos, grabados] = await Promise.all([
    getVentanaLlavero(),
    getPerfilesLlavero(),
    prisma.keyringJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: ULTIMOS,
      select: {
        id: true, nombre: true, material: true, unidades: true,
        anchoMm: true, altoMm: true, umbral: true, invertido: true,
        // OJO: `vistaSvg` NO se pide aquí. Son megas por diseño y la lista
        // enseña veinte; metido en el HTML tumbaba el navegador. Se pide
        // aparte, como imagen, desde /api/admin/llaveros/[id]/vista
        contornos: true, size: true,
        createdAt: true, queuedAt: true, engravedAt: true,
      },
    }),
    // El recuento va por unidades, no por diseños: lo que gasta llaveros es
    // cada pieza grabada.
    prisma.keyringJob.groupBy({
      by: ['material'],
      where: { engravedAt: { not: null } },
      _sum: { unidades: true },
      _count: { _all: true },
    }),
  ]);

  const lista: DisenoLite[] = disenos.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    material: d.material,
    unidades: d.unidades,
    anchoMm: d.anchoMm,
    altoMm: d.altoMm,
    umbral: d.umbral,
    invertido: d.invertido,
    contornos: d.contornos,
    size: d.size,
    tieneVista: d.size > 0,
    creado: formatDate(d.createdAt),
    enCola: Boolean(d.queuedAt && !d.engravedAt),
    grabado: d.engravedAt ? formatDate(d.engravedAt) : null,
  }));

  const porMaterial = (m: string) => grabados.find((g) => g.material === m);
  const dorados = porMaterial('GOLD');
  const plateados = porMaterial('SILVER');
  const totalGrabados = (dorados?._sum.unidades ?? 0) + (plateados?._sum.unidades ?? 0);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h1 className="section-title">Llaveros metálicos</h1>
            <p className="section-subtitle">
              Prueba de taller. Sube el diseño, mira cómo va a quedar y mándalo a la
              misma grabadora.
            </p>
          </div>
        </div>
        <IndicadorGrabadora />
      </div>

      {/* Cuando la máquina está esperando el pedal, que se vea desde aquí. */}
      <AvisoDePedal />

      {/* Cuántos llevamos hechos */}
      <div className="card p-4 flex flex-wrap gap-6 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-500">Grabados</div>
          <div className="text-xl font-bold text-ink-900">{totalGrabados}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-500">Dorados</div>
          <div className="text-xl font-bold" style={{ color: '#a8861f' }}>
            {dorados?._sum.unidades ?? 0}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-500">Plateados</div>
          <div className="text-xl font-bold text-ink-600">{plateados?._sum.unidades ?? 0}</div>
        </div>
        <div className="text-[11px] text-ink-500 self-end max-w-sm">
          Este recuento es solo del taller: no entra en pedidos, ni en stock, ni en el
          control de negocio.
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-ink-900 mb-3">Nuevo diseño</h2>
        <SubirDiseno anchoMm={ventana.anchoMm} altoMm={ventana.altoMm} />
      </div>

      <AjustesLlavero
        anchoMm={ventana.anchoMm}
        altoMm={ventana.altoMm}
        perfiles={perfiles.perfiles}
      />

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-ink-900">
          Diseños {lista.length >= ULTIMOS && <span className="font-normal text-ink-500">(los {ULTIMOS} últimos)</span>}
        </h2>
        {lista.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-500">
            Todavía no hay ningún diseño. Sube el primero ahí arriba.
          </div>
        ) : (
          lista.map((d) => <FichaDiseno key={d.id} d={d} />)
        )}
      </div>
    </div>
  );
}
