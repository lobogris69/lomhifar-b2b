import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { isEmailConfigured, sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Diagnóstico de emergencia del SMTP. Protegido por EMERGENCY_RESET_KEY
 * (igual que /emergency-password). Deshabilitado (404) si no hay clave.
 *
 * Uso básico (envía un email de prueba con la config actual de Railway):
 *   /api/admin/emergency-email-test?key=<KEY>&to=<destino>
 *
 * Modo SONDA (prueba varias combinaciones host/puerto con el MISMO
 * usuario/contraseña y dice cuál AUTENTICA bien, sin tocar Railway):
 *   /api/admin/emergency-email-test?key=<KEY>&probe=1
 *
 * Sirve para cuando la contraseña es correcta pero sigue dando
 * "535 authentication failed": casi siempre es que el SERVIDOR SMTP no es
 * el que toca (Hostinger propio smtp.hostinger.com vs Titan
 * smtp.titan.email) o el puerto/seguridad.
 */
export async function GET(req: Request) {
  const configuredKey = process.env.EMERGENCY_RESET_KEY;
  if (!configuredKey) return new NextResponse('Not found', { status: 404 });

  const url = new URL(req.url);
  if ((url.searchParams.get('key') ?? '') !== configuredKey) {
    return new NextResponse('Clave incorrecta', { status: 403 });
  }

  const user = (process.env.SMTP_USER ?? '').trim();
  const pass = (process.env.SMTP_PASSWORD ?? '').trim();
  const to = (url.searchParams.get('to') || user || '').trim();

  // Detecta espacios/saltos invisibles: compara longitud real vs recortada.
  function ws(key: string): string {
    const raw = process.env[key];
    if (raw == null || raw === '') return '(vacío)';
    const trimmed = raw.trim();
    if (raw.length !== trimmed.length) {
      return `⚠️ tiene ESPACIOS invisibles (${raw.length} car. reales vs ${trimmed.length} sin espacios)`;
    }
    return 'ok (sin espacios sobrantes)';
  }

  const lines: string[] = [];
  lines.push('=== DIAGNÓSTICO SMTP ===');
  lines.push(`SMTP_HOST      = ${process.env.SMTP_HOST ?? '(vacío)'}`);
  lines.push(`SMTP_PORT      = ${process.env.SMTP_PORT ?? '(vacío)'}`);
  lines.push(`SMTP_SECURE    = ${process.env.SMTP_SECURE ?? '(vacío)'}`);
  lines.push(`SMTP_USER      = ${process.env.SMTP_USER ?? '(vacío)'}  [${ws('SMTP_USER')}]`);
  lines.push(`SMTP_FROM_EMAIL= ${process.env.SMTP_FROM_EMAIL ?? '(vacío)'}`);
  lines.push(`SMTP_PASSWORD  = ${pass ? '(presente, ' + pass.length + ' caracteres)' : '(VACÍO ❌)'}  [${ws('SMTP_PASSWORD')}]`);
  lines.push(`isEmailConfigured() = ${isEmailConfigured()}`);
  lines.push('');

  if (!user || !pass) {
    lines.push('❌ Falta SMTP_USER o SMTP_PASSWORD. Revisa las variables en Railway.');
    return text(lines.join('\n'), 200);
  }

  // -------- MODO SONDA: probar varias combinaciones host/puerto --------
  if (url.searchParams.get('probe')) {
    lines.push('=== SONDA DE SERVIDORES (mismo usuario/contraseña) ===');
    lines.push('Probando qué servidor SMTP autentica bien tu buzón...');
    lines.push('');

    const combos = [
      { host: 'smtp.hostinger.com', port: 465, secure: true },
      { host: 'smtp.hostinger.com', port: 587, secure: false },
      { host: 'smtp.titan.email', port: 465, secure: true },
      { host: 'smtp.titan.email', port: 587, secure: false },
    ];

    let algunaOk = false;
    for (const c of combos) {
      const label = `${c.host}:${c.port} (secure=${c.secure})`;
      try {
        const t = nodemailer.createTransport({
          host: c.host,
          port: c.port,
          secure: c.secure,
          auth: { user, pass },
          connectionTimeout: 12000,
          greetingTimeout: 12000,
        });
        await t.verify();
        algunaOk = true;
        lines.push(`✅ ${label}  → AUTENTICA CORRECTAMENTE`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        lines.push(`❌ ${label}  → ${msg.split('\n')[0]}`);
      }
    }

    lines.push('');
    if (algunaOk) {
      lines.push('👉 Pon en Railway el SMTP_HOST/SMTP_PORT/SMTP_SECURE de la línea ✅ y listo.');
    } else {
      lines.push('⚠️ Ninguna combinación autentica → la CONTRASEÑA del buzón no coincide,');
      lines.push('   o el buzón aún no está activo. Resetea la contraseña en Hostinger y');
      lines.push('   vuelve a probar (Emails → pedidos@lomhifar.es → cambiar contraseña).');
    }
    return text(lines.join('\n'), 200);
  }

  // -------- MODO NORMAL: enviar con la config actual de Railway --------
  if (!to) {
    lines.push('⚠️ Indica un destino con &to=tu-email para probar el envío,');
    lines.push('   o usa &probe=1 para sondear qué servidor SMTP funciona.');
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
    lines.push('· "535" o "authentication failed" / "Invalid login" → contraseña o SERVIDOR incorrecto.');
    lines.push('   Prueba &probe=1 para ver qué servidor autentica bien tu buzón.');
    lines.push('· "wrong version number" / "SSL" → prueba SMTP_PORT=587 y SMTP_SECURE=false.');
    return text(lines.join('\n'), 200);
  }
}

function text(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
