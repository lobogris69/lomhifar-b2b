'use client';

import { useEffect, useState } from 'react';

/**
 * Estado de la grabadora del taller, visto desde el navegador.
 *
 * Un pedido puede tener varios grabados, y cada uno pinta su botón de enviar.
 * Si cada botón consultara por su cuenta, un pedido de diez líneas haría diez
 * peticiones cada pocos segundos. Por eso la consulta es una sola, compartida,
 * y cada componente se suscribe al resultado.
 */

export interface EstadoGrabadora {
  conectado: boolean;
  desdeHace: number | null;
  pedal: boolean;
  enCola: number;
  haciendo?: string;
  texto: string;
  tono: 'ok' | 'aviso' | 'mal';
}

/** Mientras no sepamos nada, no bloqueamos: `null` significa «aún preguntando». */
type Conocido = EstadoGrabadora | null;

const CADA = 8000;

let actual: Conocido = null;
let oyentes: Array<(e: Conocido) => void> = [];
let temporizador: ReturnType<typeof setInterval> | null = null;

async function consultar() {
  try {
    const r = await fetch('/api/admin/laser/estado', { cache: 'no-store' });
    if (!r.ok) return;
    actual = (await r.json()) as EstadoGrabadora;
  } catch {
    // Un fallo de red no es «grabadora apagada»: puede ser el wifi de aquí.
    // Nos quedamos con lo último que supimos.
    return;
  }
  oyentes.forEach((f) => f(actual));
}

function suscribir(f: (e: Conocido) => void) {
  oyentes.push(f);
  if (temporizador === null) {
    void consultar();
    temporizador = setInterval(consultar, CADA);
  } else if (actual !== null) {
    f(actual);
  }

  return () => {
    oyentes = oyentes.filter((o) => o !== f);
    if (oyentes.length === 0 && temporizador !== null) {
      clearInterval(temporizador);
      temporizador = null;
    }
  };
}

export function useEstadoGrabadora(): Conocido {
  const [estado, setEstado] = useState<Conocido>(actual);
  useEffect(() => suscribir(setEstado), []);
  return estado;
}
