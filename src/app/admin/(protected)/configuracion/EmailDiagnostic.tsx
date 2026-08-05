'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Mail, Loader2, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { sendTestEmailAction, type EmailTestState } from './actions';

const initial: EmailTestState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-secondary text-sm">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      {pending ? 'Enviando…' : 'Enviar email de prueba'}
    </button>
  );
}

/**
 * Diagnóstico de email en el admin. `configured` viene del server
 * (isEmailConfigured). El botón envía un email de prueba al propio
 * admin para confirmar que el SMTP funciona de verdad.
 */
export function EmailDiagnostic({ configured, adminEmail }: { configured: boolean; adminEmail: string }) {
  const [state, action] = useFormState(sendTestEmailAction, initial);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-4 w-4 text-brand-700" />
        <h2 className="text-sm font-semibold text-ink-900">Estado del email (SMTP)</h2>
      </div>

      {/* Estado de configuración */}
      {configured ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700 mb-3">
          <CheckCircle2 className="h-4 w-4" />
          <span>Servidor SMTP <strong>configurado</strong>. Pulsa el botón para comprobar que llega de verdad.</span>
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-3">
          <div className="flex items-start gap-2 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>El email NO está configurado.</strong> Ahora mismo{' '}
              <strong>ningún correo se está enviando</strong> (ni acuses de alta, ni códigos
              de acceso, ni avisos de pedido). Hay que configurar el SMTP en Railway.
            </div>
          </div>
        </div>
      )}

      {/* Resultado del test */}
      {state.ok && (
        <Alert variant="success" className="mb-3">
          <CheckCircle2 className="h-4 w-4 inline mr-1" />
          Email de prueba enviado a <strong>{state.sentTo}</strong>. Revisa tu bandeja
          (y la carpeta de spam). Si llega, todo funciona.
        </Alert>
      )}
      {state.error && (
        <Alert variant="danger" className="mb-3">{state.error}</Alert>
      )}

      <form action={action}>
        <SubmitBtn />
        <p className="mt-2 text-[11px] text-ink-500">
          Se enviará a <strong>{adminEmail}</strong> (tu cuenta de admin).
        </p>
      </form>

      {!configured && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-brand-700 font-medium">
            ¿Cómo configuro el SMTP en Railway?
          </summary>
          <div className="mt-2 space-y-2 text-ink-600">
            <p>En Railway → tu servicio → pestaña <strong>Variables</strong>, añade:</p>
            <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] bg-ink-50 p-2 rounded">
              <li>SMTP_HOST</li>
              <li>SMTP_PORT (587 normalmente)</li>
              <li>SMTP_USER</li>
              <li>SMTP_PASSWORD</li>
              <li>SMTP_SECURE (false para 587, true para 465)</li>
              <li>SMTP_FROM_EMAIL (ej. no-reply@lomhifar.net)</li>
              <li>SMTP_FROM_NAME (Lomhifar)</li>
            </ul>
            <p>
              Estos datos te los da tu proveedor de correo (el SMTP de tu hosting, o
              un servicio como Brevo, SendGrid, etc.). Tras guardarlos, Railway
              reinicia el servicio y vuelve a probar aquí.
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
