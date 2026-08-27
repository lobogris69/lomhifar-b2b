import potrace from 'potrace';
import Jimp from 'jimp';
import { getSetting, setSetting, SETTING_KEYS } from './settings';
import { LIMITES, PERFIL_BASE, type LaserProfile } from './laser-profiles';

/**
 * Grabado de llaveros metálicos.
 *
 * Es una prueba aparte del negocio de las pulseras: no se vende a farmacias,
 * no entra en pedidos ni en el control de negocio. Solo vive en el panel.
 *
 * El camino es el MISMO que el de las pulseras y a propósito: la imagen que
 * sube el operario se vectoriza aquí, y a partir de ahí son trazados, DXF y la
 * misma cola con el mismo pedal. Grabar una imagen punto a punto también se
 * puede, pero es mucho más lento y en metal luce peor que un trazado limpio.
 *
 * Este fichero NO toca `laser.ts`. Repite el escritor de DXF —son treinta
 * líneas— en vez de abrir sus funciones internas, porque lo de las pulseras ya
 * está afinado y comprobado en máquina, y no compensa arriesgarlo para
 * ahorrarse una repetición.
 */

// ============================================================
// Materiales y ventana de grabado
// ============================================================

export const MATERIALES = {
  GOLD: { etiqueta: 'Dorado', enNombre: 'Dorado', css: '#c9a227' },
  SILVER: { etiqueta: 'Plateado', enNombre: 'Plateado', css: '#9aa0a6' },
} as const;

export type Material = keyof typeof MATERIALES;

export function esMaterial(v: unknown): v is Material {
  return v === 'GOLD' || v === 'SILVER';
}

export function etiquetaMaterial(v?: string | null): string {
  return esMaterial(v) ? MATERIALES[v].etiqueta : 'Llavero';
}

export interface VentanaLlavero {
  /** Ancho de la zona a grabar, en mm. */
  anchoMm: number;
  /** Alto de la zona a grabar, en mm. */
  altoMm: number;
}

/** Un llavero corriente: 3 × 2 cm. Se puede cambiar desde la pantalla. */
export const VENTANA_POR_DEFECTO: VentanaLlavero = { anchoMm: 30, altoMm: 20 };

const LIMITE_VENTANA = { min: 3, max: 150 };

function medida(v: unknown, def: number): number {
  const n = Number(String(v ?? '').replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(LIMITE_VENTANA.max, Math.max(LIMITE_VENTANA.min, n));
}

export function normalizarVentana(raw: unknown): VentanaLlavero {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    anchoMm: medida(o.anchoMm, VENTANA_POR_DEFECTO.anchoMm),
    altoMm: medida(o.altoMm, VENTANA_POR_DEFECTO.altoMm),
  };
}

export async function getVentanaLlavero(): Promise<VentanaLlavero> {
  const raw = await getSetting(SETTING_KEYS.LLAVERO_VENTANA);
  if (!raw) return { ...VENTANA_POR_DEFECTO };
  try {
    return normalizarVentana(JSON.parse(raw));
  } catch {
    return { ...VENTANA_POR_DEFECTO };
  }
}

export async function saveVentanaLlavero(v: VentanaLlavero): Promise<void> {
  await setSetting(SETTING_KEYS.LLAVERO_VENTANA, JSON.stringify(normalizarVentana(v)));
}

// ============================================================
// Perfiles de máquina (dorado y plateado)
// ============================================================

export interface PerfilesLlavero {
  perfiles: LaserProfile[];
  /** Qué perfil usa cada material. */
  porMaterial: Record<string, string>;
}

/**
 * El dorado y el plateado se comportan distinto, así que van por separado y
 * separados también de los de las pulseras: tocar aquí no puede estropear lo
 * que ya está afinado para la silicona.
 *
 * Los valores de salida son los de las pulseras como punto de partida. Habrá
 * que afinarlos en máquina; para eso están.
 */
export const PERFILES_LLAVERO_POR_DEFECTO: PerfilesLlavero = {
  // SIN relleno. Lo puse relleno al principio y fue un error: al vectorizar
  // un dibujo salen los contornos de fuera Y los de los huecos de dentro, y
  // la máquina rellena cada contorno cerrado por su cuenta, sin saber cuál es
  // un hueco. Un dibujo con detalle se convierte en una mancha negra.
  // Comprobado en metal el 27/08/2026 con un grabado de una plaza: perfecto
  // en pantalla, mancha en el llavero.
  perfiles: [
    { id: 'llavero-dorado', nombre: 'Llavero dorado', ...PERFIL_BASE, relleno: false },
    { id: 'llavero-plateado', nombre: 'Llavero plateado', ...PERFIL_BASE, relleno: false },
  ],
  porMaterial: { GOLD: 'llavero-dorado', SILVER: 'llavero-plateado' },
};

function num(v: unknown, def: number, { min, max }: { min: number; max: number }): number {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

export function normalizarPerfiles(raw: unknown): PerfilesLlavero {
  const o = (raw ?? {}) as Record<string, unknown>;
  const lista = Array.isArray(o.perfiles) ? o.perfiles : [];

  const perfiles: LaserProfile[] = lista.map((p, i) => {
    const x = (p ?? {}) as Record<string, unknown>;
    const base = PERFILES_LLAVERO_POR_DEFECTO.perfiles[i] ?? PERFILES_LLAVERO_POR_DEFECTO.perfiles[0];
    return {
      id: String(x.id || base.id),
      nombre: String(x.nombre || base.nombre).slice(0, 60),
      potenciaPct: num(x.potenciaPct, base.potenciaPct, LIMITES.potenciaPct),
      velocidadMmS: num(x.velocidadMmS, base.velocidadMmS, LIMITES.velocidadMmS),
      pasadas: Math.round(num(x.pasadas, base.pasadas, LIMITES.pasadas)),
      frecuenciaKHz: num(x.frecuenciaKHz, base.frecuenciaKHz, LIMITES.frecuenciaKHz),
      relleno: x.relleno === undefined ? base.relleno : Boolean(x.relleno),
      pasoRellenoMm: num(x.pasoRellenoMm, base.pasoRellenoMm, LIMITES.pasoRellenoMm),
      notas: String(x.notas ?? '').slice(0, 500),
    };
  });

  if (perfiles.length === 0) {
    return {
      perfiles: PERFILES_LLAVERO_POR_DEFECTO.perfiles.map((p) => ({ ...p })),
      porMaterial: { ...PERFILES_LLAVERO_POR_DEFECTO.porMaterial },
    };
  }

  const ids = new Set(perfiles.map((p) => p.id));
  const mapa = (o.porMaterial ?? {}) as Record<string, unknown>;
  const porMaterial: Record<string, string> = {};
  for (const m of Object.keys(MATERIALES)) {
    const pedido = String(mapa[m] ?? '');
    porMaterial[m] = ids.has(pedido)
      ? pedido
      : (PERFILES_LLAVERO_POR_DEFECTO.porMaterial[m] && ids.has(PERFILES_LLAVERO_POR_DEFECTO.porMaterial[m])
        ? PERFILES_LLAVERO_POR_DEFECTO.porMaterial[m]
        : perfiles[0].id);
  }
  return { perfiles, porMaterial };
}

export async function getPerfilesLlavero(): Promise<PerfilesLlavero> {
  const raw = await getSetting(SETTING_KEYS.LLAVERO_PERFILES);
  if (!raw) return normalizarPerfiles(null);
  try {
    return normalizarPerfiles(JSON.parse(raw));
  } catch {
    return normalizarPerfiles(null);
  }
}

export async function savePerfilesLlavero(cfg: PerfilesLlavero): Promise<void> {
  await setSetting(SETTING_KEYS.LLAVERO_PERFILES, JSON.stringify(normalizarPerfiles(cfg)));
}

export function perfilParaMaterial(cfg: PerfilesLlavero, material?: string | null): LaserProfile {
  const id = cfg.porMaterial[(material ?? '').toUpperCase()];
  return cfg.perfiles.find((p) => p.id === id) ?? cfg.perfiles[0];
}

// ============================================================
// Vectorizado
// ============================================================

export interface Punto { x: number; y: number }

export interface Trazado {
  /** Contornos cerrados, en las coordenadas del dibujo original. */
  contornos: Punto[][];
  /** Tamaño del dibujo vectorizado (mismo sistema que los contornos). */
  ancho: number;
  alto: number;
}

/**
 * Cuánto detalle se conserva del dibujo.
 *
 * El vectorizado dibuja el CONTORNO de cada trazo, no el trazo: una línea
 * negra sale como dos líneas paralelas, una a cada lado. En una pieza de
 * 30 mm, con demasiado detalle esas parejas se juntan y el grabado sale
 * emborronado — y encima tarda muchísimo, porque el láser tiene que recorrer
 * cada contorno.
 *
 * Se arregla ANTES de vectorizar, reduciendo la imagen y tirando las manchas
 * pequeñas. Bajar el umbral no sirve para esto: el umbral decide qué es negro,
 * no cuánto detalle hay.
 *
 * Medido con un grabado real: a «fino» salían 1.728 contornos y 209.564
 * puntos en 30 × 20 mm, que en metal es una mancha.
 */
export const DETALLES = {
  grueso: { etiqueta: 'Grueso — pocas líneas, limpio y rápido', lado: 500, ruido: 20 },
  medio: { etiqueta: 'Medio', lado: 900, ruido: 8 },
  fino: { etiqueta: 'Fino — mucho detalle, lento y puede emborronarse', lado: 1500, ruido: 3 },
} as const;

export type Detalle = keyof typeof DETALLES;

export function esDetalle(v: unknown): v is Detalle {
  return v === 'grueso' || v === 'medio' || v === 'fino';
}

export const DETALLE_POR_DEFECTO: Detalle = 'medio';

export const UMBRAL_POR_DEFECTO = 128;

/** Cuántos tramos rectos por curva. Igual criterio que en las pulseras. */
const PASOS_CURVA = 16;

/**
 * Convierte la imagen en contornos.
 *
 * En metal no hay grises: el láser marca o no marca. El umbral decide dónde
 * está la frontera, y por eso se puede ajustar desde la pantalla: el mismo
 * dibujo sale hueco y sucio con un umbral y macizo con otro.
 */
export async function vectorizar(
  imagen: Buffer,
  opciones: { umbral?: number; invertir?: boolean; detalle?: Detalle } = {},
): Promise<Trazado> {
  const umbral = Math.min(254, Math.max(1, Math.round(opciones.umbral ?? UMBRAL_POR_DEFECTO)));
  const nivel = DETALLES[opciones.detalle ?? DETALLE_POR_DEFECTO];

  // Se reduce ANTES de trazar. Trazar una imagen de 3.000 píxeles para grabar
  // en 30 mm no da más calidad: da más contornos, más tiempo de láser y un
  // grabado más sucio.
  //
  // Y se aplasta sobre blanco: lo transparente tiene que contar como «no
  // grabar», no como negro.
  const foto = await Jimp.read(imagen);
  const fondo = new Jimp(foto.bitmap.width, foto.bitmap.height, 0xffffffff);
  fondo.composite(foto, 0, 0);
  if (Math.max(fondo.bitmap.width, fondo.bitmap.height) > nivel.lado) {
    fondo.scaleToFit(nivel.lado, nivel.lado);
  }
  const preparada = await fondo.getBufferAsync(Jimp.MIME_PNG);

  const svg = await new Promise<string>((resolver, rechazar) => {
    potrace.trace(
      preparada,
      {
        threshold: umbral,
        // Manchas más pequeñas que esto se tiran. Cada una es un viaje del
        // láser y en metal no se distingue.
        turdSize: nivel.ruido,
        optCurve: true,
        blackOnWhite: !opciones.invertir,
      },
      (e: Error | null, s?: string) => (e ? rechazar(e) : resolver(s ?? '')),
    );
  });

  return trazadoDesdeSvg(svg);
}

/** Saca los contornos del SVG que devuelve potrace. */
function trazadoDesdeSvg(svg: string): Trazado {
  const vb = /viewBox="([\d.\-\s]+)"/.exec(svg);
  const partes = vb ? vb[1].trim().split(/\s+/).map(Number) : [0, 0, 100, 100];
  const ancho = partes[2] || 100;
  const alto = partes[3] || 100;

  const contornos: Punto[][] = [];
  const paths = svg.matchAll(/\sd="([^"]+)"/g);
  for (const m of paths) {
    for (const sub of subcaminos(m[1])) {
      if (sub.length >= 3) contornos.push(sub);
    }
  }
  return { contornos, ancho, alto };
}

/**
 * Parte el atributo `d` en contornos cerrados.
 *
 * potrace solo emite M, L y C en absoluto, y cierra cada contorno volviendo a
 * su punto de partida, así que cada «M» abre uno nuevo.
 */
function subcaminos(d: string): Punto[][] {
  const salida: Punto[][] = [];
  const trozos = d.split(/(?=[Mm])/);

  for (const trozo of trozos) {
    const limpio = trozo.trim();
    if (!limpio) continue;

    const tokens = limpio.match(/[MLCZmlcz]|-?\d*\.?\d+(?:e[+-]?\d+)?/gi) ?? [];
    const puntos: Punto[] = [];
    let actual: Punto = { x: 0, y: 0 };
    let i = 0;
    let orden = '';

    const siguiente = () => Number(tokens[i++]);

    while (i < tokens.length) {
      const t = tokens[i];
      if (/^[MLCZmlcz]$/.test(t)) {
        orden = t;
        i += 1;
        if (orden === 'Z' || orden === 'z') continue;
      }
      if (orden === 'M' || orden === 'm') {
        actual = { x: siguiente(), y: siguiente() };
        puntos.push(actual);
        // Tras un «moveto», las parejas sueltas son «lineto».
        orden = 'L';
      } else if (orden === 'L' || orden === 'l') {
        actual = { x: siguiente(), y: siguiente() };
        puntos.push(actual);
      } else if (orden === 'C' || orden === 'c') {
        const c1 = { x: siguiente(), y: siguiente() };
        const c2 = { x: siguiente(), y: siguiente() };
        const fin = { x: siguiente(), y: siguiente() };
        for (let k = 1; k <= PASOS_CURVA; k += 1) {
          puntos.push(bezier(actual, c1, c2, fin, k / PASOS_CURVA));
        }
        actual = fin;
      } else {
        i += 1; // token que no sabemos leer: se ignora
      }
    }
    if (puntos.length) salida.push(puntos);
  }
  return salida;
}

function bezier(p0: Punto, p1: Punto, p2: Punto, p3: Punto, t: number): Punto {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

// ============================================================
// Encaje en la ventana de grabado
// ============================================================

export interface Encaje {
  contornos: Punto[][];
  escala: number;
  /** Tamaño que ocupa el dibujo ya encajado, en mm. */
  anchoMm: number;
  altoMm: number;
  /** Cuántos puntos hay que recorrer. Da la medida de lo que va a tardar. */
  puntos: number;
}

/** Rectángulo que ocupa el dibujo de verdad, ignorando el aire de alrededor. */
function limitesDelDibujo(contornos: Punto[][]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of contornos) {
    for (const p of c) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, maxX, minY, maxY, ancho: maxX - minX, alto: maxY - minY };
}

/**
 * Mete el dibujo dentro de la ventana sin deformarlo y lo centra.
 *
 * Se mide el DIBUJO, no el lienzo de la imagen: una imagen generada suele
 * traer aire blanco alrededor, y encajando por el lienzo el grabado salía
 * pequeño y descentrado sin que se viera el motivo.
 *
 * Se encaja entero, nunca se recorta: en un llavero, perder un trozo del
 * dibujo por llenar el rectángulo es peor que dejar aire.
 *
 * Las coordenadas salen ya en el sistema del DXF: milímetros desde la esquina
 * inferior izquierda y con la Y hacia arriba. El SVG las da hacia abajo.
 */
export function encajarEnVentana(t: Trazado, v: VentanaLlavero, margenMm = 0): Encaje {
  const lim = limitesDelDibujo(t.contornos);
  const utilAncho = Math.max(0.1, v.anchoMm - margenMm * 2);
  const utilAlto = Math.max(0.1, v.altoMm - margenMm * 2);

  if (!lim || lim.ancho <= 0 || lim.alto <= 0) {
    return { contornos: [], escala: 1, anchoMm: 0, altoMm: 0, puntos: 0 };
  }

  const escala = Math.min(utilAncho / lim.ancho, utilAlto / lim.alto);
  const anchoMm = lim.ancho * escala;
  const altoMm = lim.alto * escala;
  const offsetX = (v.anchoMm - anchoMm) / 2;
  const offsetY = (v.altoMm - altoMm) / 2;

  let puntos = 0;
  const contornos = t.contornos.map((c) => {
    puntos += c.length;
    return c.map((p) => ({
      x: offsetX + (p.x - lim.minX) * escala,
      // Y al revés: en el SVG crece hacia abajo y en el DXF hacia arriba.
      y: v.altoMm - (offsetY + (p.y - lim.minY) * escala),
    }));
  });

  return { contornos, escala, anchoMm, altoMm, puntos };
}

// ============================================================
// DXF
// ============================================================

/**
 * Escribe el DXF del llavero. Mismo formato exacto que el de las pulseras
 * (R2000, milímetros, LWPOLYLINE cerradas con sus marcadores de subclase),
 * porque es el que MeerK40t lee bien y ya está comprobado en máquina.
 */
export function dxfDeLlavero(encaje: Encaje, v: VentanaLlavero): string {
  const entidades: string[] = [];
  let handle = 0x100;

  for (const contorno of encaje.contornos) {
    const cab = [
      '0', 'LWPOLYLINE',
      '5', (handle++).toString(16).toUpperCase(),
      '100', 'AcDbEntity',
      '8', '0',
      '100', 'AcDbPolyline',
      '90', String(contorno.length),
      '70', '1',
    ];
    const puntos: string[] = [];
    for (const p of contorno) {
      puntos.push('10', p.x.toFixed(4));
      puntos.push('20', p.y.toFixed(4));
    }
    entidades.push([...cab, ...puntos].join('\n'));
  }

  return [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER', '1', 'AC1015',
    '9', '$INSUNITS', '70', '4',
    '9', '$EXTMIN', '10', '0.0', '20', '0.0', '30', '0.0',
    '9', '$EXTMAX', '10', String(v.anchoMm), '20', String(v.altoMm), '30', '0.0',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES',
    entidades.join('\n'),
    '0', 'ENDSEC',
    '0', 'EOF',
  ].join('\n');
}

// ============================================================
// Vista previa
// ============================================================

/**
 * Dibuja lo que se va a grabar: el rectángulo del llavero a escala y, dentro,
 * los contornos ya encajados. No es la imagen original: es el trazado, que es
 * lo que va a salir en el metal.
 */
/**
 * Cuántos puntos como mucho lleva la VISTA PREVIA.
 *
 * El grabado de una plaza salió con 209.564 puntos. Eso, escrito como SVG,
 * son 3,2 MB de texto por diseño, y la lista enseña veinte: el navegador se
 * caía con un error genérico al abrir la página.
 *
 * Se dibuja igual pero con menos puntos. A 400 píxeles de ancho no se nota
 * ninguna diferencia, y el DXF que va a la máquina NO se toca: ese conserva
 * todos los puntos.
 */
const PUNTOS_VISTA = 12000;

/** Quita puntos intermedios para dibujar, sin cambiar la forma. */
function aligerar(contornos: Punto[][]): Punto[][] {
  const total = contornos.reduce((a, c) => a + c.length, 0);
  if (total <= PUNTOS_VISTA) return contornos;

  const salto = Math.ceil(total / PUNTOS_VISTA);
  return contornos.map((c) => {
    if (c.length <= 4) return c;
    const menos = c.filter((_, i) => i % salto === 0);
    // Se cierra siempre por donde cerraba, o aparecen cortes.
    if (menos[menos.length - 1] !== c[c.length - 1]) menos.push(c[c.length - 1]);
    return menos.length >= 3 ? menos : c;
  });
}

export function svgDeLlavero(
  encaje: Encaje,
  v: VentanaLlavero,
  material: Material,
  relleno: boolean,
): string {
  const PAD = 3;
  const fondo = MATERIALES[material].css;

  const trazos = aligerar(encaje.contornos).map((c) => {
    const d = c
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(3)} ${(v.altoMm - p.y).toFixed(3)}`)
      .join(' ');
    return `${d} Z`;
  });

  // Cómo se pinta esto TIENE que ser cómo lo hace la máquina, aunque quede
  // feo. Antes se dibujaba con `evenodd`, que deja huecos los contornos de
  // dentro, y quedaba precioso en pantalla. Pero la máquina rellena cada
  // contorno cerrado por separado, sin saber cuál es un hueco, así que salía
  // una mancha. Se enseñaba una cosa y se grababa otra.
  const caminos = relleno
    ? trazos
      .map((d) => `<path d="${d}" fill="#1a1a20" stroke="none"/>`)
      .join(' ')
    : `<path d="${trazos.join(' ')}" fill="none" stroke="#1a1a20" stroke-width="0.15"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-PAD} ${-PAD} ${v.anchoMm + PAD * 2} ${v.altoMm + PAD * 2}" width="100%" style="max-width:100%;height:auto;background:#f4f4f6;font-family:system-ui,sans-serif;">
  <rect x="0" y="0" width="${v.anchoMm}" height="${v.altoMm}" rx="1.2" fill="${fondo}" stroke="#00000033" stroke-width="0.2"/>
  ${caminos}
  <text x="${v.anchoMm / 2}" y="${-0.9}" text-anchor="middle" font-size="1.4" fill="#54545f">${v.anchoMm} mm</text>
  <text x="${-1}" y="${v.altoMm / 2}" text-anchor="middle" font-size="1.4" fill="#54545f" transform="rotate(-90 ${-1} ${v.altoMm / 2})">${v.altoMm} mm</text>
</svg>`;
}

// ============================================================
// Nombre del fichero que se manda al taller
// ============================================================

/**
 * El puente elige el perfil por lo que lee en el nombre, igual que hace con
 * «Negra» y «Roja» en las pulseras. Aquí van «Dorado» y «Plateado».
 */
export function nombreDeFicheroLlavero(opts: {
  nombre: string;
  material: Material;
  unidades: number;
  fecha?: Date;
}): string {
  const f = opts.fecha ?? new Date();
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(f);

  const slug = (opts.nombre || 'llavero')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    // Igual que en las pulseras: una «x» pegada a un número podría leerse
    // como una cantidad a grabar.
    .replace(/x(?=[0-9])/g, 'x_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
    .slice(0, 30)
    .replace(/_+$/, '') || 'llavero';

  const material = MATERIALES[opts.material].enNombre;
  return `${ymd}_Llavero_${material}_${slug}.dxf`;
}
