import Link from 'next/link';
import { ArrowLeft, FolderOpen, Download, FileArchive, Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Alert } from '@/components/ui/Alert';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Histórico DXF · Admin Lomhifar' };

interface PageProps {
  searchParams: { q?: string };
}

/** Formatea "2026-08-03" a "Lunes 3 de agosto de 2026" en español.
 * A prueba de fallos: si el valor no es una fecha válida, devuelve el
 * texto tal cual en vez de lanzar (Intl.format con fecha inválida lanza
 * RangeError y tumbaría toda la página). */
function humanDate(ymd: string): string {
  try {
    const [y, m, d] = ymd.split('-').map((n) => Number(n));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ymd;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (Number.isNaN(dt.getTime())) return ymd;
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'UTC',
    }).format(dt).replace(/^./, (c) => c.toUpperCase());
  } catch {
    return ymd;
  }
}

/** Hora HH:MM en Europe/Madrid, a prueba de fallos. */
function humanTime(dt: Date): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
    }).format(dt);
  } catch {
    return '—';
  }
}

export default async function LaserArchivePage({ searchParams }: PageProps) {
  const q = (searchParams.q ?? '').trim();

  // Filtro opcional por texto grabado / cliente
  const where = q
    ? {
        OR: [
          { linesJoined: { contains: q, mode: 'insensitive' as const } },
          { pharmacyName: { contains: q, mode: 'insensitive' as const } },
          { filename: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  type FileRow = {
    id: string;
    orderId: string;
    orderNumber: number;
    pharmacyName: string;
    filename: string;
    size: number;
    line1: string;
    line2: string | null;
    line3: string | null;
    color: string;
    totalUnits: number;
    dateFolder: string;
    createdBy: string | null;
    createdAt: Date;
  };

  let files: FileRow[] = [];
  let loadError: string | null = null;
  try {
    files = await prisma.laserFile.findMany({
      where,
      orderBy: [{ dateFolder: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, orderId: true, orderNumber: true, pharmacyName: true,
        filename: true, size: true, line1: true, line2: true, line3: true,
        color: true, totalUnits: true, dateFolder: true, createdBy: true, createdAt: true,
      },
      take: 500,
    });
  } catch (e) {
    loadError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    // eslint-disable-next-line no-console
    console.error('[laser/archivo] fallo al cargar el histórico:', e);
  }

  // Agrupar por fecha (dateFolder ya viene ordenado desc)
  const byDate = new Map<string, typeof files>();
  for (const f of files) {
    if (!byDate.has(f.dateFolder)) byDate.set(f.dateFolder, []);
    byDate.get(f.dateFolder)!.push(f);
  }
  const dates = Array.from(byDate.entries());
  const totalFiles = files.length;

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
            <FolderOpen className="h-5 w-5" />
          </span>
          <div>
            <h1 className="section-title">Histórico de archivos láser</h1>
            <p className="section-subtitle">
              Todos los DXF descargados desde los pedidos, agrupados por fecha.
            </p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <form className="card p-4 flex flex-wrap items-end gap-3" action="/admin/laser/archivo">
        <div className="w-full sm:flex-1 sm:min-w-[240px]">
          <label className="label" htmlFor="q">Buscar por texto, farmacia o nombre de archivo</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="ej. DIABETES, Farmacia López, 00042…"
              className="input pl-9"
            />
          </div>
        </div>
        <button type="submit" className="btn-primary">Buscar</button>
        {q && (
          <Link href="/admin/laser/archivo" className="btn-ghost text-xs">Limpiar</Link>
        )}
      </form>

      {loadError ? (
        <Alert variant="danger" title="No se pudo cargar el histórico">
          <p className="text-sm">Error técnico al leer los archivos láser:</p>
          <pre className="mt-2 text-xs bg-red-50 border border-red-200 rounded p-2 overflow-x-auto whitespace-pre-wrap">{loadError}</pre>
        </Alert>
      ) : files.length === 0 ? (
        <Alert variant="info" title={q ? 'Sin resultados' : 'Aún no hay archivos'}>
          {q ? (
            <p className="text-sm">
              No hay ningún DXF que coincida con &laquo;{q}&raquo;. Prueba con menos texto o quita el filtro.
            </p>
          ) : (
            <p className="text-sm">
              Cuando descargues DXF de un pedido desde{' '}
              <code className="bg-ink-100 px-1 rounded text-xs">/admin/pedidos/[id]</code>,
              se irán acumulando aquí ordenados por fecha para que tengas control total
              de lo que has grabado y cuándo.
            </p>
          )}
        </Alert>
      ) : (
        <>
          <div className="text-xs text-ink-500">
            {totalFiles} archivo{totalFiles === 1 ? '' : 's'} en {dates.length}{' '}
            {dates.length === 1 ? 'día' : 'días'}{q ? ` que coinciden con «${q}»` : ''}.
          </div>

          <div className="space-y-4">
            {dates.map(([date, list]) => (
              <details key={date} open className="card overflow-hidden">
                <summary className="px-5 py-3 border-b border-ink-100 bg-ink-50/40 cursor-pointer flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-4 w-4 text-brand-700 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-ink-900">📁 {date}</div>
                      <div className="text-[11px] text-ink-500">
                        {humanDate(date)} · {list.length} archivo{list.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`/api/admin/laser/zip/${date}`}
                    className="btn-secondary text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileArchive className="h-3.5 w-3.5" /> ZIP del día
                  </a>
                </summary>
                <div className="overflow-x-auto">
                  <table className="table-pro min-w-[720px]">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Pedido</th>
                        <th>Farmacia</th>
                        <th>Texto grabado</th>
                        <th>Color</th>
                        <th className="text-right">Uds</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((f) => {
                        const time = humanTime(f.createdAt);
                        return (
                          <tr key={f.id}>
                            <td className="text-xs text-ink-500 font-mono">{time}</td>
                            <td>
                              <Link
                                href={`/admin/pedidos/${f.orderId}`}
                                className="text-brand-700 hover:underline font-semibold text-sm"
                              >
                                #{f.orderNumber}
                              </Link>
                            </td>
                            <td className="text-sm">{f.pharmacyName}</td>
                            <td className="text-xs font-mono text-ink-700">
                              {f.line1}
                              {f.line2 && <div className="text-ink-500">{f.line2}</div>}
                              {f.line3 && <div className="text-ink-500">{f.line3}</div>}
                            </td>
                            <td>
                              <span className={`badge ${f.color === 'RED' ? 'bg-red-100 text-red-800' : 'bg-ink-100 text-ink-800'}`}>
                                {f.color === 'RED' ? 'Roja' : 'Negra'}
                              </span>
                            </td>
                            <td className="text-right font-semibold text-sm">{f.totalUnits}</td>
                            <td className="text-right">
                              <a
                                href={`/api/admin/laser/file/${f.id}`}
                                className="btn-ghost text-xs"
                                title={`Descargar ${f.filename}`}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>

          {totalFiles === 500 && (
            <Alert variant="info">
              Mostrando los 500 archivos más recientes. Usa el buscador para acotar por texto
              o farmacia si necesitas ver más antiguos.
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
