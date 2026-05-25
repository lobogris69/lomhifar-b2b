'use client';

import { useEffect } from 'react';

/**
 * Componente sin UI. Cuando la URL contiene un hash del tipo `#scroll-{anchor}`:
 *  - Hace scroll suave hasta el elemento con id="scroll-{anchor}"
 *  - Le añade brevemente (~3s) un anillo magenta para destacarlo visualmente
 *
 * Lo usamos en las páginas públicas para que cuando el admin pulse "Ver en la
 * web" desde /admin/textos, la zona afectada se vea claramente.
 */
export function HashHighlight() {
  useEffect(() => {
    function highlightFromHash() {
      const hash = window.location.hash;
      if (!hash || !hash.startsWith('#scroll-')) return;

      // Pequeño delay para que el navegador termine de renderizar
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (!el) return;

      // Scroll suave
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Highlight: añadir clase con animación magenta y quitarla después
      el.classList.add('hash-highlight-ring');
      const timer = window.setTimeout(() => {
        el.classList.remove('hash-highlight-ring');
      }, 3500);

      return () => window.clearTimeout(timer);
    }

    // Ejecutar al cargar la página (con un pequeño delay para que termine el render)
    const initial = window.setTimeout(highlightFromHash, 250);

    // Y también si cambia el hash sin recargar
    window.addEventListener('hashchange', highlightFromHash);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener('hashchange', highlightFromHash);
    };
  }, []);

  return null;
}
