import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { canAccessPath } from '@/lib/admin-roles';
import { diagnoseCorreos, getCorreosConfig, trackShipment, CorreosError } from '@/lib/correos';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Diagnóstico de la API de Correos (nueva REST vía Correos ID) SIN crear
 * ningún envío.
 *
 * Acceso: basta con estar logueado en el panel de admin (rol con acceso a
 * /admin/configuracion). Alternativamente, si EMERGENCY_RESET_KEY está
 * puesta en Railway, se puede llamar con ?key=<KEY> (para scripts).
 *
 *   Probar credenciales (token + gateway):
 *     /api/admin/correos-test
 *
 *   Seguir un envío REAL (cuando ya haya uno):
 *     /api/admin/correos-test?track=<codigoEnvio>
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  // Guard: sesión de admin O clave de emergencia (si está configurada).
  const configuredKey = process.env.EMERGENCY_RESET_KEY;
  const keyOk = Boolean(configuredKey) && url.searchParams.get('key') === configuredKey;
  if (!keyOk) {
    const session = await getAdminSession();
    if (!session || !canAccessPath(session.role, '/admin/configuracion')) {
      return text('No autorizado. Inicia sesión en el panel de administración y vuelve a abrir esta URL.', 403);
    }
  }

  const c = getCorreosConfig();
  const lines: string[] = [];
  lines.push('=== DIAGNÓSTICO API CORREOS (REST / Correos ID) ===');
  lines.push('');
  lines.push('Variables en Railway:');
  lines.push(`  CORREOS_CLIENT_ID       = ${mask(c.oauthClientId)}`);
  lines.push(`  CORREOS_CLIENT_SECRET   = ${c.oauthClientSecret ? '(presente, ' + c.oauthClientSecret.length + ' car.)' : '(VACÍO ❌)'}`);
  lines.push(`  CORREOS_GATEWAY_*       = ${process.env.CORREOS_GATEWAY_CLIENT_ID ? 'par propio' : '(usa el de Correos ID)'}`);
  lines.push(`  CORREOS_NUM_CONTRATO    = ${c.contractNumber || '(vacío)'}`);
  lines.push(`  CORREOS_NUM_CLIENTE     = ${c.clientNumber || '(vacío)'}`);
  lines.push(`  CORREOS_COD_ETIQUETADOR = ${c.labellerCode || '(vacío)'}`);
  lines.push(`  Token URL               = ${c.tokenUrl}`);
  lines.push(`  Seguimiento base        = ${c.trackingBase}`);
  lines.push('');

  // Modo seguimiento de un envío real
  const trackCode = (url.searchParams.get('track') ?? '').trim();
  if (trackCode) {
    lines.push(`=== SEGUIMIENTO de ${trackCode} ===`);
    try {
      const r = await trackShipment(trackCode);
      lines.push(`Producto: ${r.product ?? '?'} · Remitente: ${r.senderName ?? '?'} · Destino: ${r.addresseeName ?? '?'}`);
      lines.push('');
      if (r.events.length === 0) {
        lines.push('(sin eventos todavía)');
      } else {
        for (const e of r.events) {
          lines.push(`· ${e.date ?? ''}  ${e.text ?? ''}  ${e.location ? '(' + e.location + ')' : ''}`.trim());
        }
      }
    } catch (e) {
      const err = e instanceof CorreosError ? e : new CorreosError(String(e));
      lines.push(`❌ ${err.message}${err.status ? ` [HTTP ${err.status}]` : ''}`);
      if (err.body) lines.push(`   Respuesta: ${err.body}`);
    }
    return text(lines.join('\n'), 200);
  }

  // Modo diagnóstico de credenciales (por defecto)
  const diag = await diagnoseCorreos();
  for (const s of diag.steps) {
    lines.push(`— ${s.name}`);
    lines.push(`  ${s.detail.replace(/\n/g, '\n  ')}`);
    lines.push('');
  }
  lines.push(diag.ok
    ? '👉 Todo correcto. La integración de Correos puede pedir token y consultar el gateway.'
    : '👉 Revisa los pasos con ❌ arriba.');

  return text(lines.join('\n'), 200);
}

function mask(v: string): string {
  if (!v) return '(VACÍO ❌)';
  if (v.length <= 8) return v;
  return `${v.slice(0, 8)}…${v.slice(-4)}`;
}

function text(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
