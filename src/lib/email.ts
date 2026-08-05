import nodemailer, { type Transporter } from 'nodemailer';

let cached: Transporter | null = null;

/**
 * Lee una variable de entorno recortando espacios/saltos de línea
 * invisibles. En Railway es fácil que al pegar un valor quede un espacio
 * al final, y en SMTP eso rompe la autenticación (contraseña "correcta"
 * pero con un espacio => 535 authentication failed). Devuelve undefined
 * si queda vacía.
 */
function env(key: string): string | undefined {
  const v = process.env[key];
  if (v == null) return undefined;
  const t = v.trim();
  return t === '' ? undefined : t;
}

/**
 * ¿Están configuradas las credenciales SMTP? Si devuelve false, los
 * emails NO se envían de verdad (se usa un transporte "falso" que
 * finge éxito). Útil para mostrar un aviso en el admin.
 */
export function isEmailConfigured(): boolean {
  return Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASSWORD'));
}

/**
 * Envía un email de prueba y devuelve si realmente salió. Lanza el
 * error real si el SMTP está configurado pero falla (credenciales,
 * host, etc.) para poder mostrarlo en el diagnóstico.
 */
export async function sendTestEmail(to: string): Promise<{ configured: boolean }> {
  const configured = isEmailConfigured();
  await sendEmail({
    to,
    subject: 'Prueba de email · Lomhifar',
    html: emailLayout(`
      <h2 style="margin:0 0 12px;color:#921a5e;">✅ El email funciona</h2>
      <p>Si estás leyendo esto, la configuración SMTP de tu plataforma Lomhifar
      es correcta y los avisos a clientes se están enviando bien.</p>
      <p style="color:#54545f;font-size:13px;margin-top:16px;">Este es un mensaje de prueba enviado desde el panel de administración.</p>
    `),
  });
  return { configured };
}

function getTransporter(): Transporter {
  if (cached) return cached;

  const host = env('SMTP_HOST');
  const port = Number(env('SMTP_PORT') ?? 587);
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASSWORD');
  const secure = (env('SMTP_SECURE') ?? 'false').toLowerCase() === 'true';

  if (!host || !user || !pass) {
    console.warn('[email] SMTP no configurado. Los emails se imprimirán por consola.');
    cached = nodemailer.createTransport({ jsonTransport: true });
    return cached;
  }

  cached = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cached;
}

function fromAddress() {
  const name = env('SMTP_FROM_NAME') ?? 'Lomhifar';
  const email = env('SMTP_FROM_EMAIL') ?? env('SMTP_USER') ?? 'no-reply@lomhifar.com';
  return `"${name}" <${email}>`;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: fromAddress(),
    to: opts.to,
    cc: opts.cc,
    bcc: opts.bcc,
    replyTo: opts.replyTo,
    subject: opts.subject,
    html: opts.html,
    text: opts.text ?? stripHtml(opts.html),
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[email] ${opts.subject} → ${Array.isArray(opts.to) ? opts.to.join(', ') : opts.to}`);
    if ((info as any).message) {
      console.log('[email] payload:', (info as any).message.toString());
    }
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ============================================================
// Plantilla base
// ============================================================

export function emailLayout(content: string, opts?: { preheader?: string }): string {
  const preheader = opts?.preheader ?? '';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Lomhifar</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#1e242b;">
${preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(13,13,17,0.08);">
      <tr><td style="background:linear-gradient(135deg,#921a5e 0%,#d12686 100%);padding:28px 32px;">
        <div style="color:#fff;font-size:24px;font-weight:700;letter-spacing:0.5px;">Lomhifar</div>
        <div style="color:#fce7f4;font-size:13px;margin-top:4px;">Canal exclusivo farmacia · Pulseras de identificación sanitaria</div>
      </td></tr>
      <tr><td style="padding:32px;">${content}</td></tr>
      <tr><td style="padding:18px 32px;background:#f7f7f8;color:#54545f;font-size:12px;line-height:1.5;border-top:1px solid #eeeef0;">
        Este mensaje ha sido enviado por la plataforma B2B de Lomhifar. Si no esperabas este correo, ignóralo.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
