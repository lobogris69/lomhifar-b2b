'use client';

import { Printer } from 'lucide-react';

/**
 * Botón que dispara la impresión nativa del navegador (Ctrl/Cmd+P).
 * Usuario puede elegir "Guardar como PDF" en el diálogo.
 */
export function PrintButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className || 'btn-secondary'}
    >
      <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
    </button>
  );
}
