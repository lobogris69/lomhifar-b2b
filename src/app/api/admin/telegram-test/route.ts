import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { canAccessPath } from '@/lib/admin-roles';
import { isTelegramConfigured, notifyTelegram } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Prueba y ayuda de configuración de los avisos por Telegram.
 *
 * Acceso: logueado en el panel (rol con /admin/configuracion) o ?key=<EMERGENCY_RESET_KEY>.
 *
 *   Ver estado:                 /api/admin/telegram-test
 *   Descubrir tu chat_id:       /api/admin/telegram-test?updates=1
 *       (antes: escribe cualquier cosa a @Pulseras_Personalizadas_bot)
 *   Enviar mensaje de prueba:   /api/admin/telegram-test?send=1
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  const configuredKey = process.env.EMERGENCY_RESET_KEY;
  const keyOk = Boolean(configuredKey) && url.searchParams.get('key') === configuredKey;
  if (!keyOk) {
    const session = await getAdminSession();
    if (!session || !canAccessPath(session.role, '/admin/configuracion')) {
      return text('No autorizado. Inicia sesión en el panel de administración y vuelve a abrir esta URL.', 403);
    }
  }

  const token = (process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID ?? '').trim();
  const lines: string[] = [];
  lines.push('=== AVISOS TELEGRAM ===');
  lines.push(`TELEGRAM_BOT_TOKEN = ${token ? '(presente, ' + token.length + ' car.)' : '(VACÍO ❌)'}`);
  lines.push(`TELEGRAM_CHAT_ID   = ${chatId || '(vacío ❌)'}`);
  lines.push(`Configurado        = ${isTelegramConfigured() ? 'sí ✅' : 'no ❌'}`);
  lines.push('');

  // Descubrir chat_id: lee los mensajes recientes que ha recibido el bot.
  if (url.searchParams.get('updates')) {
    if (!token) return text(lines.join('\n') + '\nFalta TELEGRAM_BOT_TOKEN.', 200);
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, { cache: 'no-store' });
      const data = (await res.json()) as { ok: boolean; result?: Array<Record<string, unknown>> };
      const results = data.result ?? [];
      lines.push('=== CHATS QUE HAN ESCRITO AL BOT ===');
      if (results.length === 0) {
        lines.push('(ninguno todavía) → abre Telegram, busca @Pulseras_Personalizadas_bot,');
        lines.push('escríbele cualquier cosa y recarga esta página.');
      } else {
        const seen = new Set<string>();
        for (const u of results) {
          const msg = (u.message ?? u.channel_post ?? {}) as Record<string, unknown>;
          const chat = (msg.chat ?? {}) as Record<string, unknown>;
          const id = chat.id != null ? String(chat.id) : '';
          if (!id || seen.has(id)) continue;
          seen.add(id);
          const name = [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.title || chat.username || '';
          lines.push(`· chat_id = ${id}   (${String(name)})`);
        }
        lines.push('');
        lines.push('👉 Pon ese chat_id en la variable TELEGRAM_CHAT_ID de Railway.');
      }
    } catch (e) {
      lines.push(`Error leyendo getUpdates: ${e instanceof Error ? e.message : String(e)}`);
    }
    return text(lines.join('\n'), 200);
  }

  // Enviar mensaje de prueba.
  if (url.searchParams.get('send')) {
    const r = await notifyTelegram('✅ <b>Prueba de avisos Lomhifar</b>\nSi ves esto, las notificaciones de altas y pedidos funcionan.');
    lines.push('=== ENVÍO DE PRUEBA ===');
    lines.push(r.ok ? `✅ Enviado a ${r.sent} chat(s).` : `❌ No se pudo enviar: ${r.error ?? 'desconocido'}`);
    return text(lines.join('\n'), 200);
  }

  lines.push('Opciones:');
  lines.push('  ?updates=1  → descubrir tu chat_id (escribe antes al bot).');
  lines.push('  ?send=1     → enviar un mensaje de prueba.');
  return text(lines.join('\n'), 200);
}

function text(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
