'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Save, ExternalLink } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { BraceletPreview } from '@/components/shop/BraceletPreview';
import type { MarketingPersona } from '@/lib/settings';
import { savePersonas, type SavePersonasState } from './actions';

const initial: SavePersonasState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Guardando…' : 'Guardar las 8 personas'}
    </button>
  );
}

export function PersonasEditor({
  initialPersonas,
  photoUrls,
}: {
  initialPersonas: MarketingPersona[];
  photoUrls: (string | null)[];
}) {
  const [state, action] = useFormState(savePersonas, initial);
  const [personas, setPersonas] = useState<MarketingPersona[]>(initialPersonas);

  function update(i: number, field: keyof MarketingPersona, value: string) {
    setPersonas((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value } as MarketingPersona;
      return next;
    });
  }

  return (
    <form action={action} className="space-y-6">
      {state.ok && (
        <Alert variant="success">Personas guardadas. Recarga la landing para ver los cambios.</Alert>
      )}
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <div className="space-y-5">
        {personas.map((p, i) => (
          <PersonaCard
            key={i}
            index={i}
            persona={p}
            photoUrl={photoUrls[i]}
            onUpdate={(field, value) => update(i, field, value)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-ink-100 -mx-6 lg:-mx-10 px-6 lg:px-10 py-4 flex items-center justify-between shadow-card">
        <a
          href="/#personas"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink-500 hover:text-ink-800 inline-flex items-center gap-1"
        >
          Ver landing pública <ExternalLink className="h-3 w-3" />
        </a>
        <Submit />
      </div>
    </form>
  );
}

function PersonaCard({
  index,
  persona,
  photoUrl,
  onUpdate,
}: {
  index: number;
  persona: MarketingPersona;
  photoUrl: string | null;
  onUpdate: (field: keyof MarketingPersona, value: string) => void;
}) {
  const i = index;
  const prefix = `p${i}`;
  return (
    <fieldset className="card p-5">
      <legend className="text-sm font-semibold text-ink-900 px-2 -ml-2 mb-3 flex items-center gap-2">
        <span className="text-2xl">{persona.emoji}</span>
        <span>Persona {i + 1} — {persona.group || '(sin nombre)'}</span>
      </legend>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Columna izquierda: campos texto */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid sm:grid-cols-4 gap-3">
            <Field
              label="Emoji"
              name={`${prefix}_emoji`}
              value={persona.emoji}
              onChange={(v) => onUpdate('emoji', v)}
              maxLength={8}
              className="sm:col-span-1"
            />
            <Field
              label="Grupo / título"
              name={`${prefix}_group`}
              value={persona.group}
              onChange={(v) => onUpdate('group', v)}
              maxLength={60}
              className="sm:col-span-3"
              placeholder="Ej: Niños"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Rango de edad"
              name={`${prefix}_ageRange`}
              value={persona.ageRange}
              onChange={(v) => onUpdate('ageRange', v)}
              maxLength={40}
              placeholder="Ej: 4 - 12 años"
            />
            <div>
              <label className="label" htmlFor={`${prefix}_color`}>
                Color de la pulsera
              </label>
              <select
                id={`${prefix}_color`}
                name={`${prefix}_color`}
                value={persona.color}
                onChange={(e) => onUpdate('color', e.target.value)}
                className="input"
              >
                <option value="BLACK">Negra</option>
                <option value="RED">Roja</option>
              </select>
            </div>
          </div>

          <Field
            label="Contexto / patología (línea pequeña gris)"
            name={`${prefix}_context`}
            value={persona.context}
            onChange={(v) => onUpdate('context', v)}
            maxLength={200}
            placeholder="Ej: Asma, alergias graves, epilepsia infantil"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Pulsera — Línea 1 (grabado)"
              name={`${prefix}_line1`}
              value={persona.line1}
              onChange={(v) => onUpdate('line1', v)}
              maxLength={30}
              monospace
              placeholder="Ej: ASMA · EPILEPSIA"
            />
            <Field
              label="Pulsera — Línea 2 (grabado)"
              name={`${prefix}_line2`}
              value={persona.line2}
              onChange={(v) => onUpdate('line2', v)}
              maxLength={30}
              monospace
              placeholder="Ej: MAMÁ 666 111 222"
            />
          </div>

          <Textarea
            label="Descripción / por qué (texto al pie)"
            name={`${prefix}_why`}
            value={persona.why}
            onChange={(v) => onUpdate('why', v)}
            maxLength={500}
            rows={3}
            placeholder="Ej: En el cole, parque o excursiones…"
          />
        </div>

        {/* Columna derecha: vista previa + acceso a foto custom */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-ink-500">Vista previa</div>
          <div className="bg-ink-50/60 rounded-lg p-3">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Foto custom"
                className="w-full h-auto rounded"
              />
            ) : (
              <BraceletPreview color={persona.color} line1={persona.line1} line2={persona.line2} size="sm" />
            )}
          </div>
          <div className="text-[11px] text-ink-500 leading-relaxed">
            {photoUrl ? (
              <>
                Esta persona tiene <strong>foto custom</strong>. Para cambiarla
                o quitarla, ve a{' '}
                <a
                  href={`/admin/imagenes#persona-${i + 1}`}
                  className="text-brand-700 underline"
                >
                  Imágenes del sitio
                </a>{' '}
                → slot &laquo;persona-{i + 1}&raquo;.
              </>
            ) : (
              <>
                Por defecto se muestra el dibujo SVG con el grabado de las
                líneas 1 y 2. Si quieres mostrar una foto real,{' '}
                <a
                  href="/admin/imagenes"
                  className="text-brand-700 underline"
                >
                  súbela
                </a>{' '}
                en el slot &laquo;persona-{i + 1}&raquo;.
              </>
            )}
          </div>
        </div>
      </div>
    </fieldset>
  );
}

function Field({
  label, name, value, onChange, maxLength, placeholder, className, monospace,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  monospace?: boolean;
}) {
  return (
    <div className={className}>
      <label className="label flex items-center justify-between" htmlFor={name}>
        <span>{label}</span>
        {maxLength && (
          <span className="text-[10px] text-ink-400 font-normal">
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`input ${monospace ? 'font-mono uppercase tracking-wide' : ''}`}
      />
    </div>
  );
}

function Textarea({
  label, name, value, onChange, maxLength, rows, placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  rows: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label flex items-center justify-between" htmlFor={name}>
        <span>{label}</span>
        {maxLength && (
          <span className="text-[10px] text-ink-400 font-normal">
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}
