'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { applicationSchema, normalizeIban } from '@/lib/validations';
import { normalizeCif, normalizeEmail } from '@/lib/utils';
import { emailLayout, sendEmail } from '@/lib/email';
import { getSetting, parseRecipients, SETTING_KEYS } from '@/lib/settings';

export interface ApplyState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

export async function submitApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const values: Record<string, string> = {};
  for (const key of [
    'cif',
    'email',
    'pharmacyName',
    'contactName',
    'phone',
    'whatsapp',
    'address',
    'city',
    'postalCode',
    'province',
    'bankAccount',
    'message',
  ]) {
    values[key] = String(formData.get(key) ?? '');
  }

  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { fieldErrors: fe, values };
  }

  const data = parsed.data;
  const cif = normalizeCif(data.cif);
  const email = normalizeEmail(data.email);
  const bankAccount = normalizeIban(data.bankAccount);
  const whatsapp = data.whatsapp ? data.whatsapp.trim() : '';

  // Si ya es cliente, lo bloqueamos
  const existing = await prisma.customer.findUnique({ where: { cif } });
  if (existing) {
    return {
      error:
        'Ya existe una farmacia registrada con ese CIF. Acceda con su email asociado.',
      values,
    };
  }

  // Evitar duplicar solicitudes pendientes
  const pending = await prisma.pharmacyApplication.findFirst({
    where: { cif, status: 'PENDING' },
  });

  const payload = {
    cif,
    email,
    pharmacyName: data.pharmacyName,
    contactName: data.contactName,
    phone: data.phone,
    whatsapp: whatsapp || null,
    address: data.address,
    city: data.city,
    postalCode: data.postalCode,
    province: data.province,
    bankAccount,
    message: data.message || null,
  };

  const app = pending
    ? await prisma.pharmacyApplication.update({
        where: { id: pending.id },
        data: payload,
      })
    : await prisma.pharmacyApplication.create({
        data: payload,
      });

  const recipients = parseRecipients(await getSetting(SETTING_KEYS.ORDERS_RECIPIENT_EMAILS));

  // Notificar a Lomhifar
  await sendEmail({
    to: recipients,
    subject: `Nueva solicitud de alta · ${data.pharmacyName}`,
    replyTo: data.email,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#921a5e;">Solicitud de alta de farmacia</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#54545f;width:160px;">Farmacia</td><td style="font-weight:600;">${data.pharmacyName}</td></tr>
        <tr><td style="padding:6px 0;color:#54545f;">CIF/NIF</td><td>${cif}</td></tr>
        <tr><td style="padding:6px 0;color:#54545f;">Contacto</td><td>${data.contactName}</td></tr>
        <tr><td style="padding:6px 0;color:#54545f;">Email</td><td>${email}</td></tr>
        <tr><td style="padding:6px 0;color:#54545f;">Teléfono</td><td>${data.phone}</td></tr>
        ${whatsapp ? `<tr><td style="padding:6px 0;color:#54545f;">WhatsApp</td><td>${whatsapp}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#54545f;">Dirección</td><td>${data.address}</td></tr>
        <tr><td style="padding:6px 0;color:#54545f;">Localidad</td><td>${data.city} (${data.postalCode}) · ${data.province}</td></tr>
        <tr><td style="padding:6px 0;color:#54545f;">IBAN</td><td style="font-family:monospace;">${bankAccount}</td></tr>
      </table>
      ${data.message ? `<div style="margin-top:16px;padding:12px;background:#f7f7f8;border-left:3px solid #d12686;border-radius:6px;"><strong>Mensaje:</strong><br/>${escapeHtml(data.message)}</div>` : ''}
      <p style="margin-top:24px;color:#54545f;font-size:13px;">
        Revise y apruebe en el panel de administración.
      </p>
    `),
  });

  // Acuse de recibo al solicitante
  await sendEmail({
    to: email,
    subject: 'Hemos recibido su solicitud · Lomhifar',
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#921a5e;">Solicitud recibida</h2>
      <p style="margin:0 0 12px;line-height:1.6;">
        Gracias por su interés en trabajar con Lomhifar.
        Hemos recibido la solicitud de alta de <strong>${data.pharmacyName}</strong>.
      </p>
      <p style="margin:0 0 12px;">Nuestro equipo la revisará y le contactará en horas hábiles.</p>
      <p style="margin:0;color:#54545f;font-size:13px;">Referencia: ${app.id.slice(-8).toUpperCase()}</p>
    `),
  });

  redirect('/solicitud/enviada');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
