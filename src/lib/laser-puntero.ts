import { getSetting, setSetting, SETTING_KEYS } from './settings';

/**
 * El puntero rojo de la grabadora, mandado desde la web.
 *
 * La máquina está en el taller y la web en internet, así que la web no le
 * habla directamente: deja escrito qué referencia quiere ver y el puente lo
 * recoge en la misma consulta con la que pide la cola, cada pocos segundos.
 *
 * El puntero NO dispara: mueve los espejos con el diodo rojo encendido para
 * que se vea dónde va a caer el grabado.
 */

export const REFERENCIAS = {
  apagar: { etiqueta: 'Apagar el puntero', fichero: null },
  centro: { etiqueta: 'Centro del campo', fichero: 'cruz_centro.dxf' },
  pulsera: { etiqueta: 'Placa de pulsera (24 × 10)', fichero: 'rect24x10.dxf' },
  llavero: { etiqueta: 'Llavero (30 × 20)', fichero: 'rect30x20.dxf' },
} as const;

export type Referencia = keyof typeof REFERENCIAS;

export function esReferencia(v: unknown): v is Referencia {
  return typeof v === 'string' && v in REFERENCIAS;
}

export async function getPuntero(): Promise<Referencia> {
  const v = await getSetting(SETTING_KEYS.LASER_PUNTERO);
  return esReferencia(v) ? v : 'apagar';
}

export async function setPuntero(v: Referencia): Promise<void> {
  await setSetting(SETTING_KEYS.LASER_PUNTERO, v);
}

/**
 * Apaga el puntero. Se llama al mandar un trabajo a la grabadora: no tiene
 * sentido que el puntero siga paseando mientras la máquina prepara un
 * grabado, y ademas el puente no puede hacer las dos cosas a la vez.
 */
export async function apagarPuntero(): Promise<void> {
  await setPuntero('apagar');
}
