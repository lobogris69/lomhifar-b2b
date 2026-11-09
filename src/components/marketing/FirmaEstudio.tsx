// Firma de Estudio Fase (versión eclipse, 9-nov-2026) para el pie de la parte pública.
// Misma lógica que D:\MARCA PROPIA\firma\firma.mjs, copiada aquí porque al desplegar esa carpeta no existe.
// Sin JavaScript: <details> abre y cierra el menú (estudiofase.com y el WhatsApp de Fernando y de Eduardo
// con el mensaje ya escrito). Server Component sin onClick. Estilos .ef-firma/.ef-menu en globals.css.
// FIRMA_OFF=1 en el servidor la quita.
const ESTUDIO = {
  web: 'https://estudiofase.com',
  whatsapp: [
    ['Fernando', '34649848900'],
    ['Eduardo', '34697568989'],
  ] as const,
};

const PROYECTO = 'Pulseras personalizadas Lomhifar';

export function FirmaEstudio() {
  if (process.env.FIRMA_OFF === '1') return null;
  const msg = (n: string) => `Hola ${n}, he visto la web de ${PROYECTO} y me interesa una web así.`;
  const utm = `${ESTUDIO.web}/?utm_source=pulseras-lomhifar&utm_medium=firma`;
  return (
    <details className="ef-firma">
      <summary>
        Web creada por{' '}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/estudio-fase.svg" alt="" width={14} height={14} loading="lazy" />
        <b>ESTUDIO FASE</b>
      </summary>
      <div className="ef-menu" role="menu">
        <a role="menuitem" href={utm} target="_blank" rel="noopener">
          estudiofase.com <span aria-hidden="true">↗</span>
        </a>
        {ESTUDIO.whatsapp.map(([n, tel]) => (
          <a
            key={tel}
            role="menuitem"
            href={`https://wa.me/${tel}?text=${encodeURIComponent(msg(n))}`}
            target="_blank"
            rel="noopener"
          >
            WhatsApp · {n}
          </a>
        ))}
      </div>
    </details>
  );
}
