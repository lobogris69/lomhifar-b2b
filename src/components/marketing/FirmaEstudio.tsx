// Firma de Estudio Fase (v2, 9-nov-2026) para el pie de la parte pública.
// Misma lógica que MARCA PROPIA/firma/firma.mjs (commit 38f0f34), copiada aquí porque al desplegar esa carpeta no existe.
// «Web creada por» + logo REAL compacto en SVG en línea (letras en currentColor, toman el color del pie).
// Sin JavaScript: <details> abre y cierra el menú: «Visitar estudiofase.com» y «Contactar por WhatsApp»
// (sin nombres de personas, decisión de Fernando). Server Component sin onClick. Estilos .ef-* en globals.css.
// FIRMA_OFF=1 en el servidor la quita.
import { LogoEstudioFase } from './LogoEstudioFase';

const ESTUDIO = { web: 'https://estudiofase.com', whatsapp: '34649848900' };
const PROYECTO = 'Pulseras personalizadas Lomhifar';

export function FirmaEstudio() {
  if (process.env.FIRMA_OFF === '1') return null;
  const msg = `Hola, he visto la web de ${PROYECTO} y me interesa una web así.`;
  const utm = `${ESTUDIO.web}/?utm_source=pulseras-lomhifar&utm_medium=firma`;
  return (
    <details className="ef-firma">
      <summary>
        <span className="ef-txt">Web creada por</span>
        <span className="ef-logo" role="img" aria-label="Estudio Fase">
          <LogoEstudioFase />
        </span>
      </summary>
      <div className="ef-menu" role="menu">
        <a role="menuitem" href={utm} target="_blank" rel="noopener">
          Visitar estudiofase.com <span aria-hidden="true">↗</span>
        </a>
        <a
          role="menuitem"
          href={`https://wa.me/${ESTUDIO.whatsapp}?text=${encodeURIComponent(msg)}`}
          target="_blank"
          rel="noopener"
        >
          Contactar por WhatsApp
        </a>
      </div>
    </details>
  );
}
