'use client';

import { useState } from 'react';
import { KeyRound, Loader2, Copy, Check } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { regenerarClaveDelPuente } from './actions';

/**
 * Clave con la que el puente del taller se identifica ante la web.
 *
 * Se enseña entera a propósito: hay que copiarla al fichero de configuración
 * del PC de la grabadora. No es una contraseña de persona.
 */
export function ClaveDelPuente({ claveActual }: { claveActual: string }) {
  const [clave, setClave] = useState(claveActual);
  const [generando, setGenerando] = useState(false);
  const [copiada, setCopiada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    if (clave && !confirm(
      'Se generará una clave nueva y la anterior dejará de funcionar.\n\n' +
      'El puente del taller no podrá recoger trabajos hasta que le copies la nueva. ¿Continuar?',
    )) return;

    setGenerando(true);
    setError(null);
    const r = await regenerarClaveDelPuente();
    setGenerando(false);
    if (r.error) setError(r.error);
    else if (r.clave) {
      setClave(r.clave);
      setCopiada(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(clave);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2000);
    } catch {
      setError('No he podido copiar. Selecciona la clave y cópiala a mano.');
    }
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-brand-700" />
        <h3 className="text-sm font-semibold text-ink-900">
          Clave del puente de la grabadora
        </h3>
      </div>
      <p className="text-xs text-ink-500">
        El programa que controla el láser en el taller usa esta clave para recoger
        los trabajos que envíes desde los pedidos. Se copia una sola vez, en el
        fichero <code className="bg-ink-100 px-1 rounded">puente.json</code> del PC
        de la grabadora.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      {clave ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-[240px] text-[11px] font-mono bg-ink-50 border border-ink-200 rounded px-2 py-1.5 break-all">
            {clave}
          </code>
          <button type="button" onClick={copiar} className="btn-secondary text-xs">
            {copiada ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiada ? 'Copiada' : 'Copiar'}
          </button>
        </div>
      ) : (
        <Alert variant="info">
          Todavía no hay clave. Sin ella, el puente no puede recoger trabajos.
        </Alert>
      )}

      <button
        type="button"
        onClick={generar}
        disabled={generando}
        className="btn-ghost text-xs"
      >
        {generando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
        {clave ? 'Generar una nueva' : 'Generar clave'}
      </button>
    </div>
  );
}
