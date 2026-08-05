'use client';

import { FileArchive } from 'lucide-react';

/**
 * Enlace "ZIP del día". Es un Client Component PORQUE necesita un
 * onClick (stopPropagation) para que al pulsarlo NO se pliegue el
 * <details> del grupo de fecha. Los manejadores de eventos no pueden
 * vivir en un Server Component (rompería la serialización RSC).
 */
export function ZipDayLink({ date }: { date: string }) {
  return (
    <a
      href={`/api/admin/laser/zip/${date}`}
      className="btn-secondary text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <FileArchive className="h-3.5 w-3.5" /> ZIP del día
    </a>
  );
}
