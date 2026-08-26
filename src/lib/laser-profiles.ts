import { getSettings, setSetting, SETTING_KEYS } from './settings';

/**
 * Perfiles de grabado láser.
 *
 * Cada material se comporta distinto bajo el láser, así que los parámetros
 * de la máquina no son globales: van por perfil. Cambiar de proveedor o
 * probar un material nuevo es dar de alta un perfil, sin tocar los que ya
 * están afinados y funcionando.
 *
 * Se guardan como JSON en la tabla `Setting` (clave `laser.profiles`) para
 * no necesitar una migración de base de datos: son pocos registros y sólo
 * los toca el admin.
 *
 * Los valores por defecto son los que Eduardo tiene verificados en su
 * grabadora de fibra sobre pulsera (26-ago-2026): 70 %, 250 mm/s, 1 pasada,
 * 30 kHz y SIN relleno — el contorno se lee mejor que el hatch a este tamaño.
 */

export interface LaserProfile {
  id: string;
  nombre: string;
  /** Potencia en % (0-100). En la máquina se traduce a 0-1000. */
  potenciaPct: number;
  /** Velocidad de marcado en mm/s. */
  velocidadMmS: number;
  /** Nº de pasadas sobre el mismo trazado (loops en EZCAD). */
  pasadas: number;
  /** Frecuencia del pulso en kHz. Cambia mucho el resultado según material. */
  frecuenciaKHz: number;
  /** Relleno (hatch) del interior de las letras, además del contorno. */
  relleno: boolean;
  /** Separación entre líneas de relleno, en mm. Sólo aplica si relleno=true. */
  pasoRellenoMm: number;
  /** Notas del operario: qué material, qué proveedor, qué tal va. */
  notas: string;
}

export interface LaserProfilesConfig {
  perfiles: LaserProfile[];
  /** Qué perfil usa cada color de pulsera. Clave = color del OrderItem. */
  porColor: Record<string, string>;
}

export const PERFIL_BASE: Omit<LaserProfile, 'id' | 'nombre'> = {
  potenciaPct: 70,
  velocidadMmS: 250,
  pasadas: 1,
  frecuenciaKHz: 30,
  relleno: false,
  pasoRellenoMm: 0.05,
  notas: '',
};

export const CONFIG_POR_DEFECTO: LaserProfilesConfig = {
  perfiles: [
    { id: 'negra', nombre: 'Pulsera negra', ...PERFIL_BASE },
    { id: 'roja', nombre: 'Pulsera roja', ...PERFIL_BASE },
  ],
  porColor: { BLACK: 'negra', RED: 'roja' },
};

// ============================================================
// Límites de validación
// ============================================================

export const LIMITES = {
  potenciaPct: { min: 1, max: 100 },
  velocidadMmS: { min: 10, max: 10000 },
  pasadas: { min: 1, max: 20 },
  frecuenciaKHz: { min: 1, max: 200 },
  pasoRellenoMm: { min: 0.01, max: 2 },
} as const;

function num(v: unknown, def: number, { min, max }: { min: number; max: number }): number {
  // Ojo: un campo ausente o vacío tiene que caer al valor por defecto, no
  // recortarse al mínimo. Sin esta guarda, Number('') da 0 y un perfil al
  // que le falte la velocidad acabaría a 10 mm/s en vez de a 250.
  if (v === null || v === undefined || String(v).trim() === '') return def;
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

/**
 * Normaliza lo que venga del JSON guardado. Nunca lanza: si el contenido
 * está corrupto o es de una versión antigua, se cae a los valores por
 * defecto en vez de romper el admin.
 */
export function normalizar(raw: unknown): LaserProfilesConfig {
  const obj = (raw ?? {}) as Partial<LaserProfilesConfig>;
  const lista = Array.isArray(obj.perfiles) ? obj.perfiles : [];

  const perfiles: LaserProfile[] = lista
    .filter((p) => p && typeof p === 'object')
    .map((p, i) => {
      const q = p as Partial<LaserProfile>;
      return {
        id: String(q.id ?? `perfil-${i + 1}`).slice(0, 40),
        nombre: String(q.nombre ?? `Perfil ${i + 1}`).slice(0, 60),
        potenciaPct: num(q.potenciaPct, PERFIL_BASE.potenciaPct, LIMITES.potenciaPct),
        velocidadMmS: num(q.velocidadMmS, PERFIL_BASE.velocidadMmS, LIMITES.velocidadMmS),
        pasadas: Math.round(num(q.pasadas, PERFIL_BASE.pasadas, LIMITES.pasadas)),
        frecuenciaKHz: num(q.frecuenciaKHz, PERFIL_BASE.frecuenciaKHz, LIMITES.frecuenciaKHz),
        relleno: Boolean(q.relleno),
        pasoRellenoMm: num(q.pasoRellenoMm, PERFIL_BASE.pasoRellenoMm, LIMITES.pasoRellenoMm),
        notas: String(q.notas ?? '').slice(0, 500),
      };
    });

  if (perfiles.length === 0) {
    return { ...CONFIG_POR_DEFECTO, perfiles: [...CONFIG_POR_DEFECTO.perfiles] };
  }

  // El mapeo por color sólo puede apuntar a perfiles que existan.
  const ids = new Set(perfiles.map((p) => p.id));
  const porColor: Record<string, string> = {};
  for (const [color, id] of Object.entries(obj.porColor ?? {})) {
    if (typeof id === 'string' && ids.has(id)) porColor[color] = id;
  }
  // Cualquier color sin asignar cae al primer perfil.
  for (const color of ['BLACK', 'RED']) {
    if (!porColor[color]) porColor[color] = perfiles[0].id;
  }

  return { perfiles, porColor };
}

// ============================================================
// Lectura y escritura
// ============================================================

export async function getLaserProfiles(): Promise<LaserProfilesConfig> {
  const s = await getSettings();
  const raw = s[SETTING_KEYS.LASER_PROFILES];
  if (!raw) return normalizar(null);
  try {
    return normalizar(JSON.parse(raw));
  } catch {
    return normalizar(null);
  }
}

export async function saveLaserProfiles(cfg: LaserProfilesConfig): Promise<void> {
  await setSetting(SETTING_KEYS.LASER_PROFILES, JSON.stringify(normalizar(cfg)));
}

/**
 * Perfil que corresponde a un color de pulsera. Si el color no está
 * mapeado (material nuevo aún sin configurar), devuelve el primero, que
 * siempre existe.
 */
export function perfilParaColor(cfg: LaserProfilesConfig, color?: string | null): LaserProfile {
  const id = cfg.porColor[(color ?? '').toUpperCase()];
  return cfg.perfiles.find((p) => p.id === id) ?? cfg.perfiles[0];
}

/**
 * Traduce un perfil a los parámetros que espera la máquina.
 * La potencia va en 0-1000 (no en %), que es la escala del controlador.
 */
export function paramsDeMaquina(p: LaserProfile) {
  return {
    potencia: Math.round(p.potenciaPct * 10),
    velocidadMmS: p.velocidadMmS,
    pasadas: p.pasadas,
    frecuenciaKHz: p.frecuenciaKHz,
    operacion: p.relleno ? ('hatch' as const) : ('engrave' as const),
    pasoRellenoMm: p.pasoRellenoMm,
  };
}
