import { NextResponse } from 'next/server';
import { isEmailConfigured, sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Diagnóstico de emergencia del SMTP: intenta enviar un email de prueba
 * y devuelve el ERROR EXACTO si falla. Protegido por EMERGENCY_RESET_KEY
 * (igual que /emergency-password). Deshabilitado (404) si no hay clave.
 *
 * Uso:
 *   /api/admin/emergency-email-test?key=<EMERGENCY_RESET_KEY>&to=<destino>
 *
 * Muestra:
 *   - qué host/puerto/user/from ve el servidor (sin la contraseña)
 *   - si SMTP_PASSWORD está presente
 *   - el resultado del envío o el error textual del SMTP
 */
export async function GET(req: Request) {
  const configuredKey = process.env.EMERGENCY_RESET_KEY;
  if (!configuredKey) return new NextResponse('Not found', { status: 404 });

  const url = new URL(req.url);
  if ((url.searchParams.get('key') ?? '') !== configuredKey) {
    return new NextResponse('Clave incorrecta', { status: 403 });
  }

  const to = url.searchParams.get('to') || process.env.SMTP_USER || '';

  const lines: string[] = [];
  lines.push('=== DIAGNÓSTICO SMTP ===');
  lines.push(`SMTP_HOST      = ${process.env.SMTP_HOST ?? '(vacío)'}`);
  lines.push(`SMTP_PORT      = ${process.env.SMTP_PORT ?? '(vacío)'}`);
  lines.push(`SMTP_SECURE    = ${process.env.SMTP_SECURE ?? '(vacío)'}`);
  lines.push(`SMTP_USER      = ${process.env.SMTP_USER ?? '(vacío)'}`);
  lines.push(`SMTP_FROM_EMAIL= ${process.env.SMTP_FROM_EMAIL ?? '(vacío)'}`);
  lines.push(`SMTP_PASSWORD  = ${process.env.SMTP_PASSWORD ? '(presente, ' + process.env.SMTP_PASSWORD.length + ' caracteres)' : '(VACÍO ❌)'}`);
  lines.push(`isEmailConfigured() = ${isEmailConfigured()}`);
  lines.push(`Destino de la prueba = ${to || '(no indicado)'}`);
  lines.push('');

  if (!isEmailConfigured()) {
    lines.push('❌ El SMTP no está completo (falta host, user o password). Revisa las variables en Railway.');
    return text(lines.join('\n'), 200);
  }
  if (!to) {
    lines.push('⚠️ Indica un destino con &to=tu-email para probar el envío.');
    return text(lines.join('\n'), 200);
  }

  try {
    await sendTestEmail(to);
    lines.push(`✅ ENVÍO CORRECTO. Se ha mandado un email de prueba a ${to}.`);
    lines.push('Revisa esa bandeja (y la carpeta de spam). Si llega, el SMTP funciona.');
    return text(lines.join('\n'), 200);
  } catch (e) {
    lines.push('❌ EL ENVÍO FALLÓ. Error exacto del servidor SMTP:');
    lines.push('');
    lines.push(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
    lines.push('');
    lines.push('Pistas:');
    lines.push('· "535" o "authentication failed" / "Invalid login" → la CONTRASEÑA es incorrecta.');
    lines.push('· "wrong version number" / "SSL" → prueba SMTP_PORT=587 y SMTP_SECURE=false.');
    lines.push('· "self signed certificate" → problema de TLS del host.');
    return text(lines.join('\n'), 200);
  }
}

function text(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
