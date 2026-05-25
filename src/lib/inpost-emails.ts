import { emailLayout, sendEmail } from './email';
import type { EventMapping } from './inpost';

interface OrderForEmail {
  id: string;
  number: number;
  email: string;
  pharmacyName: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

/**
 * Envía el email correspondiente al cliente según el tipo de evento de tracking.
 * Devuelve true si se envió correctamente, false si no aplica o falló.
 */
export async function sendTrackingEmail(
  order: OrderForEmail,
  mapping: EventMapping,
  extra?: { lockerInfo?: string; reason?: string },
): Promise<boolean> {
  if (!mapping.notify || !mapping.emailKind) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const orderUrl = `${appUrl}/tienda/pedidos/${order.id}`;
  const trackingBlock = order.trackingNumber
    ? `
      <div style="background:#fdf2f9;border:1px solid #fbcfe9;border-radius:10px;padding:18px;margin:18px 0;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#921a5e;font-weight:600;">Nº de seguimiento</div>
        <div style="font-size:18px;font-weight:700;color:#1a1a20;font-family:monospace;margin-top:4px;letter-spacing:2px;">${esc(order.trackingNumber)}</div>
        ${order.trackingUrl ? `
          <p style="margin:14px 0 0;">
            <a href="${esc(order.trackingUrl)}" style="display:inline-block;background:linear-gradient(135deg,#921a5e 0%,#d12686 100%);color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Ver seguimiento en InPost
            </a>
          </p>
        ` : ''}
      </div>
    `
    : '';

  const footer = `
    <p style="color:#54545f;font-size:13px;margin-top:22px;">
      Pedido <strong>#${order.number}</strong> ·
      <a href="${orderUrl}" style="color:#921a5e;text-decoration:none;font-weight:600;">Ver pedido en Lomhifar →</a>
    </p>
  `;

  let subject = '';
  let html = '';

  switch (mapping.emailKind) {
    case 'in_transit':
      subject = `📦 Tu pedido #${order.number} está en camino · Lomhifar`;
      html = emailLayout(`
        <h2 style="margin:0 0 12px;color:#921a5e;font-size:22px;">📦 Tu pedido está en camino</h2>
        <p style="font-size:15px;margin:0 0 14px;line-height:1.55;">
          Hola, hemos entregado tu pedido <strong>#${order.number}</strong> al transportista
          y ya está viajando hacia ti.
        </p>
        ${trackingBlock}
        <p style="color:#54545f;font-size:13px;">
          Te avisaremos cuando llegue al punto de recogida o al destino.
        </p>
        ${footer}
      `, { preheader: `Tu pedido #${order.number} viaja a tu farmacia` });
      break;

    case 'out_for_delivery':
      subject = `🚚 Tu pedido #${order.number} en reparto · Lomhifar`;
      html = emailLayout(`
        <h2 style="margin:0 0 12px;color:#921a5e;font-size:22px;">🚚 Tu pedido sale a reparto hoy</h2>
        <p style="font-size:15px;margin:0 0 14px;line-height:1.55;">
          Hola, tu pedido <strong>#${order.number}</strong> está en la última fase
          del trayecto, dirigiéndose al destino. Si has elegido locker InPost,
          recibirás otro aviso cuando esté disponible para recoger.
        </p>
        ${trackingBlock}
        ${footer}
      `, { preheader: 'Última milla — hoy llega a destino' });
      break;

    case 'ready_locker':
      subject = `🎯 Tu pedido #${order.number} te espera en el locker · Lomhifar`;
      html = emailLayout(`
        <h2 style="margin:0 0 12px;color:#16a34a;font-size:22px;">🎯 ¡Tu pedido está listo para recoger!</h2>
        <p style="font-size:15px;margin:0 0 14px;line-height:1.55;">
          Tu pedido <strong>#${order.number}</strong> ya está en el locker InPost
          esperándote. Acude con tu DNI o utiliza el código de recogida que verás
          en la app de InPost.
        </p>
        ${extra?.lockerInfo ? `
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px;margin:12px 0;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#15803d;font-weight:600;">Ubicación</div>
            <div style="font-size:14px;color:#14532d;margin-top:4px;">${esc(extra.lockerInfo)}</div>
          </div>
        ` : ''}
        ${trackingBlock}
        <p style="color:#54545f;font-size:13px;margin-top:18px;">
          <strong>Importante:</strong> InPost te dará ~48 horas para recogerlo.
          Pasado ese plazo el envío vuelve al remitente.
        </p>
        ${footer}
      `, { preheader: `¡Está listo! Pasa a recoger tu pedido en el locker` });
      break;

    case 'delivered':
      subject = `✅ Pedido #${order.number} entregado · Lomhifar`;
      html = emailLayout(`
        <h2 style="margin:0 0 12px;color:#16a34a;font-size:22px;">✅ Pedido recibido — ¡gracias!</h2>
        <p style="font-size:15px;margin:0 0 14px;line-height:1.55;">
          Confirmamos que tu pedido <strong>#${order.number}</strong> ha sido entregado
          correctamente. Esperamos que las pulseras lleguen pronto a tus pacientes
          y sean útiles desde el primer día.
        </p>
        <p style="font-size:14px;margin:0 0 14px;line-height:1.55;color:#54545f;">
          Si necesitas reponer stock, vuelve al configurador cuando quieras.
        </p>
        <p style="margin:20px 0;">
          <a href="${esc(appUrl)}/tienda" style="display:inline-block;background:linear-gradient(135deg,#921a5e 0%,#d12686 100%);color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Hacer otro pedido
          </a>
        </p>
        ${footer}
      `, { preheader: `Tu pedido #${order.number} ha sido entregado correctamente` });
      break;

    case 'incident':
      subject = `⚠️ Incidencia en tu pedido #${order.number} · Lomhifar`;
      html = emailLayout(`
        <h2 style="margin:0 0 12px;color:#dc2626;font-size:22px;">⚠️ Incidencia con tu pedido</h2>
        <p style="font-size:15px;margin:0 0 14px;line-height:1.55;">
          Hemos recibido una notificación de incidencia con tu pedido <strong>#${order.number}</strong>:
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin:12px 0;">
          <div style="font-size:14px;color:#991b1b;font-weight:600;">${esc(mapping.label)}</div>
          ${extra?.reason ? `<div style="font-size:13px;color:#7f1d1d;margin-top:6px;">${esc(extra.reason)}</div>` : ''}
        </div>
        <p style="font-size:14px;margin:0 0 14px;line-height:1.55;color:#54545f;">
          Nuestro equipo ya está al tanto y se pondrá en contacto contigo en breve para
          resolverlo. Si necesitas información urgente, contesta a este correo o llama
          a Lomhifar.
        </p>
        ${trackingBlock}
        ${footer}
      `, { preheader: `Incidencia detectada en tu pedido #${order.number}` });
      break;

    case 'returned':
      subject = `↩️ Tu pedido #${order.number} vuelve al remitente · Lomhifar`;
      html = emailLayout(`
        <h2 style="margin:0 0 12px;color:#a16207;font-size:22px;">↩️ Pedido en devolución</h2>
        <p style="font-size:15px;margin:0 0 14px;line-height:1.55;">
          Tu pedido <strong>#${order.number}</strong> está siendo devuelto al remitente.
          Te contactaremos para coordinar el reenvío o un reembolso.
        </p>
        ${trackingBlock}
        ${footer}
      `, { preheader: `Pedido #${order.number} en devolución` });
      break;
  }

  if (!subject) return false;

  try {
    await sendEmail({ to: order.email, subject, html });
    return true;
  } catch (e) {
    console.error('[inpost] sendTrackingEmail failed:', e);
    return false;
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
