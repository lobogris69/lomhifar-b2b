/**
 * Avisos por Telegram (respaldo del email).
 *
 * Fernando quiere recibir un mensaje en Telegram cuando entra una NUEVA ALTA
 * de farmacia o un NUEVO PEDIDO, por si no se entera del email.
 *
 * Config (env en Railway):
 *   TELEGRAM_BOT_TOKEN  — token del bot (@Pulseras_Personalizadas_bot).
 *   TELEGRAM_CHAT_ID    — id de chat destino. Se admiten VARIOS separados por
 *                         coma (para avisar a más de una persona).
 *
 * Es best-effort: si Telegram falla o no está configurado, NO se lanza ninguna
 * excepción — el alta o el pedido ya están guardados y no deben romperse por
 * un aviso. Igual que los emails.
 */

const API = 'https://api.telegram.org';
const TIMEOUT_MS = 8000;

export function isTelegramConfigured(): boolean {
  return Boolean((process.env.TELEGRAM_BOT_TOKEN ?? '').trim() && (process.env.TELEGRAM_CHAT_ID ?? '').trim());
}

function chatIds(): string[] {
  return (process.env.TELEGRAM_CHAT_ID ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface TelegramResult {
  ok: boolean;
  sent: number;
  error?: string;
}

/**
 * Envía un mensaje a todos los chats configurados. `text` admite HTML básico
 * de Telegram (<b>, <i>, <a>, <code>). Nunca lanza: devuelve el resultado.
 */
export async function notifyTelegram(text: string): Promise<TelegramResult> {
  const token = (process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const ids = chatIds();
  if (!token || ids.length === 0) {
    return { ok: false, sent: 0, error: 'Telegram no configurado (falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID).' };
  }

  let sent = 0;
  let lastError: string | undefined;

  for (const chatId of ids) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(`${API}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        cache: 'no-store',
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (res.ok) {
        sent++;
      } else {
        lastError = `HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  return { ok: sent > 0, sent, error: sent === 0 ? lastError : undefined };
}

/** Escapa los caracteres que Telegram interpreta como HTML. */
export function tgEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
