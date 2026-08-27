import { getSetting, setSetting, SETTING_KEYS } from './settings';

/**
 * Estado de la grabadora del taller, tal como lo reporta el puente.
 *
 * El puente manda un latido cada pocos segundos. La web lo guarda y lo enseña,
 * para saber desde el navegador si se puede enviar un trabajo o no hace falta
 * ni intentarlo. No es una conexión en vivo: es la última noticia que tenemos.
 */

/** Sin latido en este tiempo, se da la máquina por apagada. */
const SEGUNDOS_HASTA_DARLA_POR_APAGADA = 40;

export interface LatidoDelPuente {
  /** ¿El pedal responde? Si no, el operario dispara con ENTER. */
  pedal: boolean;
  /** Trabajos que el puente tiene pendientes en su carpeta. */
  enCola: number;
  /** Qué está haciendo ahora mismo, en una línea. */
  haciendo?: string;
}

export interface EstadoDelPuente extends LatidoDelPuente {
  conectado: boolean;
  /** Segundos desde el último latido, o null si nunca ha habido ninguno. */
  desdeHace: number | null;
}

const APAGADA: EstadoDelPuente = {
  conectado: false,
  desdeHace: null,
  pedal: false,
  enCola: 0,
};

export async function guardarLatido(latido: LatidoDelPuente): Promise<void> {
  await setSetting(
    SETTING_KEYS.LASER_BRIDGE_ESTADO,
    JSON.stringify({
      pedal: Boolean(latido.pedal),
      enCola: Number.isFinite(latido.enCola) ? Math.max(0, Math.round(latido.enCola)) : 0,
      haciendo: String(latido.haciendo ?? '').slice(0, 120),
      cuando: new Date().toISOString(),
    }),
  );
}

export async function estadoDelPuente(): Promise<EstadoDelPuente> {
  const crudo = await getSetting(SETTING_KEYS.LASER_BRIDGE_ESTADO);
  if (!crudo) return APAGADA;

  try {
    const d = JSON.parse(crudo);
    const cuando = new Date(d.cuando);
    if (Number.isNaN(cuando.getTime())) return APAGADA;

    const desdeHace = Math.round((Date.now() - cuando.getTime()) / 1000);
    return {
      conectado: desdeHace <= SEGUNDOS_HASTA_DARLA_POR_APAGADA,
      desdeHace,
      pedal: Boolean(d.pedal),
      enCola: Number(d.enCola) || 0,
      haciendo: typeof d.haciendo === 'string' && d.haciendo ? d.haciendo : undefined,
    };
  } catch {
    return APAGADA;
  }
}

/**
 * Texto para el operario. Dice qué pasa y, si no se puede enviar, por qué.
 */
export function comoSeVe(e: EstadoDelPuente): { texto: string; tono: 'ok' | 'aviso' | 'mal' } {
  if (!e.conectado) {
    if (e.desdeHace === null) {
      return { texto: 'Grabadora nunca conectada', tono: 'mal' };
    }
    const min = Math.round(e.desdeHace / 60);
    return {
      texto: min < 60
        ? `Grabadora apagada (sin señal desde hace ${min || 1} min)`
        : 'Grabadora apagada',
      tono: 'mal',
    };
  }
  if (e.haciendo) return { texto: e.haciendo, tono: 'aviso' };
  if (e.enCola > 0) {
    return {
      texto: `Grabadora lista · ${e.enCola} en cola`,
      tono: 'aviso',
    };
  }
  return {
    texto: e.pedal ? 'Grabadora lista' : 'Grabadora lista (sin pedal, se dispara con ENTER)',
    tono: 'ok',
  };
}
