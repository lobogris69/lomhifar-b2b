/**
 * Miniaturas SVG esquemáticas de cada zona de la web pública.
 * No son screenshots reales — son wireframes simples que muestran
 * la estructura de la página con la zona afectada destacada en magenta.
 */

const BRAND = '#d12686';      // magenta — la zona resaltada
const BRAND_SOFT = '#fce7f4'; // magenta suave (fondo zona resaltada)
const INK = '#cbd5db';        // gris cards
const INK_SOFT = '#ebeef0';   // gris muy suave
const INK_DARK = '#1a1a20';
const PAGE_BG = '#ffffff';

interface Props {
  kind: string;
}

export function GroupThumbnail({ kind }: Props) {
  return (
    <div className="rounded-lg overflow-hidden border border-ink-100 bg-white shadow-sm">
      <svg viewBox="0 0 200 130" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
        {renderThumbnail(kind)}
      </svg>
      <div className="bg-ink-50/60 text-[9px] uppercase tracking-wider text-ink-500 text-center py-0.5">
        Miniatura
      </div>
    </div>
  );
}

function renderThumbnail(kind: string): React.ReactNode {
  switch (kind) {
    case 'header-footer':
      return <>
        {/* Header destacado */}
        <rect x="0" y="0" width="200" height="14" fill={BRAND_SOFT} stroke={BRAND} strokeWidth="1" />
        <rect x="6" y="4" width="30" height="6" fill={BRAND} rx="1" />
        <rect x="160" y="4" width="34" height="6" fill={BRAND} rx="1" />
        {/* Cuerpo neutral */}
        <rect x="10" y="22" width="180" height="78" fill={INK_SOFT} rx="2" />
        {/* Footer destacado */}
        <rect x="0" y="115" width="200" height="15" fill={BRAND_SOFT} stroke={BRAND} strokeWidth="1" />
        <rect x="80" y="120" width="40" height="5" fill={BRAND} rx="1" />
      </>;

    case 'login':
      return <>
        <rect x="0" y="0" width="200" height="130" fill="#fef0f7" />
        {/* lado izquierdo: foto + texto */}
        <rect x="10" y="20" width="100" height="40" fill={INK} rx="2" />
        <rect x="10" y="68" width="80" height="4" fill={BRAND} rx="1" />
        <rect x="10" y="76" width="100" height="3" fill={INK} rx="1" />
        <rect x="10" y="82" width="60" height="3" fill={INK} rx="1" />
        {/* tarjeta login destacada */}
        <rect x="120" y="20" width="70" height="90" fill={PAGE_BG} stroke={BRAND} strokeWidth="1.5" rx="3" />
        <rect x="128" y="30" width="54" height="14" fill={BRAND} rx="1.5" />
        <rect x="128" y="50" width="54" height="6" fill={INK_SOFT} rx="1" />
        <rect x="128" y="60" width="54" height="6" fill={INK_SOFT} rx="1" />
        <rect x="128" y="74" width="54" height="10" fill={BRAND} rx="1.5" />
      </>;

    case 'code':
      return <>
        <rect x="0" y="0" width="200" height="130" fill="#fef0f7" />
        <rect x="40" y="20" width="120" height="90" fill={PAGE_BG} stroke={BRAND} strokeWidth="1.5" rx="3" />
        <circle cx="100" cy="38" r="6" fill={BRAND} />
        <rect x="56" y="50" width="88" height="5" fill={INK_DARK} rx="1" />
        <rect x="64" y="60" width="72" height="3" fill={INK} rx="1" />
        {/* 6 cuadritos para los dígitos */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={56 + i * 15} y="72" width="11" height="14" fill={BRAND_SOFT} stroke={BRAND} strokeWidth="1" rx="1" />
        ))}
        <rect x="56" y="92" width="88" height="10" fill={BRAND} rx="1.5" />
      </>;

    case 'hero':
      return <>
        {/* fondo oscuro hero */}
        <rect x="0" y="0" width="200" height="130" fill={INK_DARK} />
        {/* zona texto */}
        <rect x="8" y="8" width="3" height="3" fill={BRAND} rx="0.5" />
        <rect x="14" y="8" width="40" height="3" fill={BRAND} rx="0.5" />
        <rect x="8" y="18" width="80" height="10" fill={PAGE_BG} rx="1" />
        <rect x="8" y="32" width="60" height="10" fill={BRAND} rx="1" />
        <rect x="8" y="46" width="90" height="3" fill="#888" rx="0.5" />
        <rect x="8" y="52" width="85" height="3" fill="#888" rx="0.5" />
        <rect x="8" y="64" width="36" height="10" fill={PAGE_BG} rx="2" />
        <rect x="48" y="64" width="36" height="10" fill="transparent" stroke={PAGE_BG} strokeWidth="0.8" rx="2" />
        {/* tarjeta visual derecha */}
        <rect x="110" y="20" width="82" height="80" fill={PAGE_BG} rx="3" />
        <rect x="118" y="28" width="40" height="3" fill={INK} rx="0.5" />
        <rect x="170" y="28" width="14" height="4" fill={BRAND} rx="1" />
        <rect x="118" y="40" width="66" height="30" fill={INK_SOFT} rx="2" />
        {/* KVs */}
        <rect x="118" y="76" width="20" height="14" fill={INK_SOFT} rx="1" />
        <rect x="141" y="76" width="20" height="14" fill={INK_SOFT} rx="1" />
        <rect x="164" y="76" width="20" height="14" fill={INK_SOFT} rx="1" />
        {/* highlight perimeter */}
        <rect x="1" y="1" width="198" height="128" fill="none" stroke={BRAND} strokeWidth="2" strokeDasharray="3,2" />
      </>;

    case 'casos':
      return <>
        {/* fondo blanco landing */}
        <rect x="0" y="0" width="200" height="130" fill={PAGE_BG} />
        {/* títulos */}
        <rect x="60" y="6" width="80" height="3" fill={BRAND} rx="0.5" />
        <rect x="50" y="14" width="100" height="6" fill={INK_DARK} rx="1" />
        {/* grid 3x2 de tarjetas destacadas */}
        {[0, 1, 2].map((c) =>
          [0, 1].map((r) => (
            <rect
              key={`${c}-${r}`}
              x={8 + c * 64}
              y={28 + r * 50}
              width="60"
              height="44"
              fill={BRAND_SOFT}
              stroke={BRAND}
              strokeWidth="1"
              rx="2"
            />
          )),
        )}
      </>;

    case 'stats':
      return <>
        <rect x="0" y="0" width="200" height="130" fill={INK_DARK} />
        <rect x="70" y="10" width="60" height="3" fill={BRAND} rx="0.5" />
        <rect x="40" y="18" width="120" height="6" fill={PAGE_BG} rx="1" />
        <rect x="55" y="28" width="90" height="6" fill={BRAND} rx="1" />
        {/* 4 stat cards */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={8 + i * 48} y="50" width="42" height="60" fill="#2a2a30" stroke={BRAND} strokeWidth="0.8" rx="2" />
            <rect x={12 + i * 48} y="56" width="6" height="6" fill={BRAND} rx="1" />
            <rect x={12 + i * 48} y="68" width="34" height="10" fill={PAGE_BG} rx="1" />
            <rect x={12 + i * 48} y="82" width="30" height="3" fill="#999" rx="0.5" />
            <rect x={12 + i * 48} y="88" width="26" height="3" fill="#999" rx="0.5" />
          </g>
        ))}
      </>;

    case 'personas':
      return <>
        <rect x="0" y="0" width="200" height="130" fill="#f7f8f8" />
        <rect x="65" y="8" width="70" height="4" fill={BRAND} rx="0.5" />
        <rect x="35" y="16" width="130" height="6" fill={INK_DARK} rx="1" />
        {/* grid 4x2 de tarjetas */}
        {[0, 1, 2, 3].map((c) =>
          [0, 1].map((r) => (
            <g key={`${c}-${r}`}>
              <rect
                x={6 + c * 48}
                y={30 + r * 48}
                width="44"
                height="44"
                fill={PAGE_BG}
                stroke={BRAND}
                strokeWidth="1"
                rx="2"
              />
              <circle cx={14 + c * 48} cy={38 + r * 48} r="4" fill={BRAND_SOFT} />
              <rect x={22 + c * 48} y={36 + r * 48} width="22" height="3" fill={INK_DARK} rx="0.5" />
              <rect x={22 + c * 48} y={41 + r * 48} width="14" height="2" fill={INK} rx="0.5" />
              <rect x={10 + c * 48} y={50 + r * 48} width="36" height="14" fill={INK_SOFT} rx="1" />
            </g>
          )),
        )}
      </>;

    case 'guia':
      return <>
        <rect x="0" y="0" width="200" height="130" fill={PAGE_BG} />
        <rect x="70" y="6" width="60" height="3" fill={BRAND} rx="0.5" />
        <rect x="50" y="14" width="100" height="5" fill={INK_DARK} rx="1" />
        {/* 6 tarjetas pequeñas */}
        {[0, 1, 2].map((c) =>
          [0, 1].map((r) => (
            <rect
              key={`${c}-${r}`}
              x={8 + c * 64}
              y={26 + r * 36}
              width="60"
              height="30"
              fill={PAGE_BG}
              stroke={BRAND}
              strokeWidth="1"
              rx="2"
            />
          )),
        )}
        {/* tip final destacado */}
        <rect x="8" y="100" width="184" height="24" fill={BRAND_SOFT} stroke={BRAND} strokeWidth="1.5" rx="2" />
        <text x="14" y="115" fontSize="8" fill={BRAND} fontWeight="bold">💡 Frase mágica</text>
      </>;

    case 'producto':
      return <>
        <rect x="0" y="0" width="200" height="130" fill="#f7f8f8" />
        {/* col izquierda con specs destacada */}
        <rect x="8" y="10" width="88" height="110" fill={PAGE_BG} stroke={BRAND} strokeWidth="1.5" rx="2" />
        <rect x="14" y="18" width="40" height="4" fill={BRAND} rx="0.5" />
        <rect x="14" y="26" width="76" height="6" fill={INK_DARK} rx="1" />
        <rect x="14" y="36" width="76" height="3" fill="#888" rx="0.5" />
        <rect x="14" y="42" width="60" height="3" fill="#888" rx="0.5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <circle cx="18" cy={56 + i * 10} r="2" fill={BRAND} />
            <rect x="24" y={54 + i * 10} width="66" height="3" fill={INK} rx="0.5" />
          </g>
        ))}
        {/* col derecha con foto */}
        <rect x="104" y="20" width="88" height="80" fill={INK_SOFT} rx="2" />
        <rect x="120" y="50" width="56" height="20" fill={INK} rx="1" />
      </>;

    case 'pvpr':
      return <>
        <rect x="0" y="0" width="200" height="130" fill="#f7f8f8" />
        <rect x="14" y="10" width="170" height="40" fill={PAGE_BG} stroke={INK} strokeWidth="0.5" rx="2" />
        <rect x="14" y="56" width="170" height="14" fill={PAGE_BG} stroke={INK} strokeWidth="0.5" rx="2" />
        {/* PVPR card destacada */}
        <rect x="14" y="78" width="170" height="42" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" rx="3" />
        <rect x="22" y="86" width="40" height="6" fill="#10b981" rx="1" />
        <rect x="22" y="96" width="80" height="5" fill={INK_DARK} rx="1" />
        <rect x="22" y="104" width="100" height="3" fill="#666" rx="0.5" />
        <rect x="22" y="110" width="80" height="3" fill="#666" rx="0.5" />
        <text x="160" y="106" fontSize="14" fill="#10b981" fontWeight="bold" textAnchor="middle">€</text>
      </>;

    case 'canal':
      return <>
        <rect x="0" y="0" width="200" height="130" fill={PAGE_BG} />
        <rect x="80" y="10" width="40" height="3" fill={BRAND} rx="0.5" />
        <rect x="50" y="18" width="100" height="5" fill={INK_DARK} rx="1" />
        {/* 6 ventajas */}
        {[0, 1, 2].map((c) =>
          [0, 1].map((r) => (
            <g key={`${c}-${r}`}>
              <rect
                x={8 + c * 64}
                y={30 + r * 46}
                width="60"
                height="40"
                fill={PAGE_BG}
                stroke={BRAND}
                strokeWidth="1"
                rx="2"
              />
              <rect x={12 + c * 64} y={34 + r * 46} width="10" height="10" fill={BRAND_SOFT} rx="2" />
              <rect x={12 + c * 64} y={48 + r * 46} width="52" height="3" fill={INK_DARK} rx="0.5" />
              <rect x={12 + c * 64} y={54 + r * 46} width="40" height="2" fill={INK} rx="0.5" />
              <rect x={12 + c * 64} y={58 + r * 46} width="44" height="2" fill={INK} rx="0.5" />
            </g>
          )),
        )}
      </>;

    case 'cta':
      return <>
        <rect x="0" y="0" width="200" height="130" fill="#f7f8f8" />
        <rect x="10" y="10" width="180" height="40" fill={INK_SOFT} rx="2" />
        {/* CTA destacado */}
        <rect x="10" y="60" width="180" height="60" fill={BRAND} rx="3" stroke="#921a5e" strokeWidth="2" />
        <rect x="20" y="72" width="90" height="6" fill={PAGE_BG} rx="1" />
        <rect x="20" y="84" width="100" height="3" fill="rgba(255,255,255,0.7)" rx="0.5" />
        <rect x="20" y="90" width="80" height="3" fill="rgba(255,255,255,0.7)" rx="0.5" />
        <rect x="130" y="80" width="22" height="14" fill={PAGE_BG} rx="2" />
        <rect x="158" y="80" width="22" height="14" fill="transparent" stroke={PAGE_BG} strokeWidth="1" rx="2" />
      </>;

    case 'configurador':
      return <>
        <rect x="0" y="0" width="200" height="130" fill="#f7f8f8" />
        <rect x="8" y="6" width="40" height="3" fill={BRAND} rx="0.5" />
        <rect x="8" y="12" width="100" height="5" fill={INK_DARK} rx="1" />
        <rect x="8" y="20" width="120" height="3" fill="#888" rx="0.5" />
        {/* preview pulsera izquierda */}
        <rect x="8" y="30" width="76" height="80" fill={PAGE_BG} stroke={INK} strokeWidth="0.5" rx="2" />
        <rect x="14" y="60" width="64" height="14" fill={INK} rx="2" />
        {/* pasos derecha */}
        <rect x="92" y="30" width="100" height="18" fill={PAGE_BG} stroke={BRAND} strokeWidth="1" rx="2" />
        <rect x="92" y="52" width="100" height="18" fill={PAGE_BG} stroke={BRAND} strokeWidth="1" rx="2" />
        <rect x="92" y="74" width="100" height="18" fill={PAGE_BG} stroke={BRAND} strokeWidth="1" rx="2" />
        <rect x="92" y="96" width="100" height="18" fill={BRAND_SOFT} stroke={BRAND} strokeWidth="1.5" rx="2" />
      </>;

    case 'carrito':
      return <>
        <rect x="0" y="0" width="200" height="130" fill={PAGE_BG} />
        <rect x="8" y="8" width="50" height="5" fill={INK_DARK} rx="1" />
        {/* items lista */}
        <rect x="8" y="22" width="124" height="30" fill={PAGE_BG} stroke={INK} strokeWidth="0.5" rx="2" />
        <rect x="14" y="28" width="32" height="18" fill={INK_SOFT} rx="1" />
        <rect x="50" y="28" width="60" height="3" fill={INK_DARK} rx="0.5" />
        <rect x="50" y="34" width="40" height="3" fill={INK} rx="0.5" />
        <rect x="8" y="58" width="124" height="30" fill={PAGE_BG} stroke={INK} strokeWidth="0.5" rx="2" />
        <rect x="14" y="64" width="32" height="18" fill={INK_SOFT} rx="1" />
        <rect x="50" y="64" width="60" height="3" fill={INK_DARK} rx="0.5" />
        {/* resumen destacado */}
        <rect x="138" y="22" width="54" height="100" fill={PAGE_BG} stroke={BRAND} strokeWidth="1.5" rx="2" />
        <rect x="144" y="28" width="42" height="3" fill={INK_DARK} rx="0.5" />
        <rect x="144" y="38" width="42" height="3" fill={INK} rx="0.5" />
        <rect x="144" y="44" width="42" height="3" fill={INK} rx="0.5" />
        <rect x="144" y="54" width="42" height="6" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.5" rx="1" />
        <rect x="144" y="66" width="42" height="8" fill={BRAND} rx="1" />
        <rect x="144" y="80" width="42" height="14" fill={BRAND} rx="1.5" />
      </>;

    case 'mispedidos':
      return <>
        <rect x="0" y="0" width="200" height="130" fill={PAGE_BG} />
        <rect x="8" y="8" width="60" height="5" fill={INK_DARK} rx="1" />
        <rect x="8" y="16" width="100" height="3" fill={INK} rx="0.5" />
        {/* tabla destacada */}
        <rect x="8" y="28" width="184" height="92" fill={PAGE_BG} stroke={BRAND} strokeWidth="1.5" rx="2" />
        <rect x="8" y="28" width="184" height="14" fill={BRAND_SOFT} stroke={BRAND} strokeWidth="0" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="12" y={48 + i * 16} width="176" height="12" fill="transparent" stroke={INK_SOFT} strokeWidth="0.5" rx="1" />
        ))}
      </>;

    case 'pedidook':
      return <>
        <rect x="0" y="0" width="200" height="130" fill={PAGE_BG} />
        {/* banner verde destacado */}
        <rect x="10" y="20" width="180" height="36" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" rx="3" />
        <circle cx="22" cy="38" r="6" fill="#16a34a" />
        <rect x="34" y="28" width="100" height="5" fill="#15803d" rx="1" />
        <rect x="34" y="38" width="140" height="3" fill="#16a34a" rx="0.5" />
        <rect x="34" y="44" width="120" height="3" fill="#16a34a" rx="0.5" />
        <rect x="10" y="68" width="180" height="50" fill={INK_SOFT} rx="2" />
      </>;

    case 'solicitud':
      return <>
        <rect x="0" y="0" width="200" height="130" fill={PAGE_BG} />
        <rect x="30" y="10" width="140" height="6" fill={INK_DARK} rx="1" />
        <rect x="40" y="20" width="120" height="3" fill={INK} rx="0.5" />
        {/* formulario destacado */}
        <rect x="20" y="30" width="160" height="90" fill={PAGE_BG} stroke={BRAND} strokeWidth="1.5" rx="3" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x="28" y={38 + i * 18} width="40" height="3" fill={INK} rx="0.5" />
            <rect x="28" y={44 + i * 18} width="144" height="8" fill={INK_SOFT} rx="1" />
          </g>
        ))}
        <rect x="120" y="110" width="50" height="8" fill={BRAND} rx="1.5" />
      </>;

    case 'solicitudok':
      return <>
        <rect x="0" y="0" width="200" height="130" fill={PAGE_BG} />
        <circle cx="100" cy="40" r="14" fill={BRAND_SOFT} stroke={BRAND} strokeWidth="2" />
        <text x="100" y="46" fontSize="14" textAnchor="middle" fill={BRAND}>✓</text>
        <rect x="40" y="64" width="120" height="6" fill={INK_DARK} rx="1" />
        <rect x="30" y="76" width="140" height="3" fill={INK} rx="0.5" />
        <rect x="30" y="82" width="140" height="3" fill={INK} rx="0.5" />
        <rect x="30" y="88" width="100" height="3" fill={INK} rx="0.5" />
        <rect x="55" y="100" width="40" height="10" fill={INK_SOFT} rx="1.5" />
        <rect x="105" y="100" width="40" height="10" fill={BRAND} rx="1.5" />
      </>;

    case 'cartel':
      return <>
        <rect x="0" y="0" width="200" height="130" fill={PAGE_BG} />
        <rect x="10" y="10" width="180" height="30" fill={INK_SOFT} rx="2" />
        {/* cartel callout destacado */}
        <rect x="10" y="50" width="180" height="70" fill={BRAND_SOFT} stroke={BRAND} strokeWidth="2" rx="3" />
        <rect x="20" y="60" width="40" height="4" fill={BRAND} rx="1" />
        <rect x="20" y="70" width="100" height="6" fill={INK_DARK} rx="1" />
        <rect x="20" y="82" width="100" height="3" fill={INK} rx="0.5" />
        <rect x="20" y="88" width="120" height="3" fill={INK} rx="0.5" />
        <rect x="20" y="98" width="36" height="12" fill={BRAND} rx="1.5" />
        <rect x="60" y="98" width="32" height="12" fill="transparent" stroke={BRAND} strokeWidth="1" rx="1.5" />
        <rect x="140" y="60" width="42" height="50" fill={PAGE_BG} stroke={INK} strokeWidth="0.5" rx="1" />
      </>;

    case 'generic':
    default:
      return <>
        <rect x="0" y="0" width="200" height="130" fill={INK_SOFT} />
        <rect x="20" y="40" width="160" height="6" fill={INK} rx="1" />
        <rect x="40" y="56" width="120" height="3" fill={INK} rx="0.5" />
        <rect x="40" y="64" width="120" height="3" fill={INK} rx="0.5" />
        <rect x="60" y="78" width="80" height="14" fill={BRAND} rx="2" />
      </>;
  }
}
