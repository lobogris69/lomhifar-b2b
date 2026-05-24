'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { emailLayout, sendEmail } from '@/lib/email';

async function ensureAdmin() {
  const s = await getAdminSession();
  if (!s) redirect('/admin/login');
}

export async function approveApplication(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const app = await prisma.pharmacyApplication.findUnique({ where: { id } });
  if (!app) return;

  // Crear / actualizar cliente
  const existing = await prisma.customer.findUnique({ where: { cif: app.cif } });
  if (existing) {
    await prisma.customer.update({
      where: { id: existing.id },
      data: {
        email: app.email,
        pharmacyName: app.pharmacyName,
        contactName: app.contactName,
        phone: app.phone,
        whatsapp: app.whatsapp,
        address: app.address,
        city: app.city,
        postalCode: app.postalCode,
        province: app.province,
        bankAccount: app.bankAccount,
        active: true,
      },
    });
  } else {
    await prisma.customer.create({
      data: {
        cif: app.cif,
        email: app.email,
        pharmacyName: app.pharmacyName,
        contactName: app.contactName,
        phone: app.phone,
        whatsapp: app.whatsapp,
        address: app.address,
        city: app.city,
        postalCode: app.postalCode,
        province: app.province,
        bankAccount: app.bankAccount,
        active: true,
        source: 'APPLICATION',
      },
    });
  }

  await prisma.pharmacyApplication.update({
    where: { id },
    data: { status: 'APPROVED', reviewedAt: new Date() },
  });

  await sendEmail({
    to: app.email,
    subject: 'Su farmacia ha sido aprobada · Lomhifar',
    html: emailLayout(`
      <h2 style="margin:0 0 12px;color:#14503b;">¡Bienvenido a Lomhifar!</h2>
      <p>Su farmacia <strong>${app.pharmacyName}</strong> ya está activa en la plataforma B2B.</p>
      <p style="margin-top:16px;">
        Acceda con su CIF <strong>${app.cif}</strong> y el email <strong>${app.email}</strong> en:
      </p>
      <p style="margin:18px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/acceso" style="background:#14503b;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">Acceder ahora</a>
      </p>
    `),
  });

  revalidatePath('/admin/solicitudes');
  revalidatePath('/admin/clientes');
}

export async function rejectApplication(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const app = await prisma.pharmacyApplication.update({
    where: { id },
    data: { status: 'REJECTED', reviewedAt: new Date(), reviewedNotes: notes },
  });

  await sendEmail({
    to: app.email,
    subject: 'Solicitud de alta · Lomhifar',
    html: emailLayout(`
      <h2 style="margin:0 0 12px;color:#14503b;">Solicitud no aprobada</h2>
      <p>Lamentamos comunicarle que, tras revisar su solicitud, no podemos dar de alta a la farmacia <strong>${app.pharmacyName}</strong> en este momento.</p>
      ${notes ? `<p style="margin-top:12px;padding:12px;background:#f6f7f8;border-left:3px solid #b91c1c;border-radius:6px;">${notes}</p>` : ''}
      <p style="margin-top:16px;">Para cualquier consulta, puede responder a este correo.</p>
    `),
  });

  revalidatePath('/admin/solicitudes');
}
