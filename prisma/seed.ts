import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_SETTINGS: { key: string; value: string }[] = [
  { key: 'price.black.cents', value: '350' },
  { key: 'price.red.cents', value: '350' },
  { key: 'shipping.cents', value: '595' },
  { key: 'shipping.free_threshold.cents', value: '5000' },
  { key: 'order.minimum.cents', value: '0' },
  { key: 'order.minimum_quantity_per_line', value: '1' },
  { key: 'order.delivery_days', value: '7' },
  {
    key: 'emails.orders_recipients',
    value: process.env.ORDERS_RECIPIENT_EMAILS ?? 'pedidos@lomhifar.es',
  },
  { key: 'engraving.max_chars', value: '19' },
  { key: 'company.name', value: 'Lomhifar' },
  { key: 'company.phone', value: '' },
  { key: 'company.email', value: 'pedidos@lomhifar.es' },
  // Impuestos (España B2B farmacia por defecto)
  { key: 'tax.vat_pct', value: '21' },
  { key: 'tax.equiv_surcharge_pct', value: '5.2' },
  { key: 'tax.equiv_surcharge_enabled', value: 'true' },
];

async function main() {
  // Admin inicial
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@lomhifar.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe!2025';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // El admin definido en ADMIN_EMAIL siempre se asegura como SUPER_ADMIN y activo.
  // Este es el "admin de sistema" - el que controla todo desde Railway.
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Administrador Lomhifar',
      role: 'SUPER_ADMIN',
      active: true,
    },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',  // forzar SUPER_ADMIN al admin del env
      active: true,
    },
  });
  console.log(`✔ Admin: ${adminEmail}`);

  // Ajustes por defecto (solo si no existen)
  for (const s of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      create: s,
      update: {},
    });
  }
  console.log(`✔ ${DEFAULT_SETTINGS.length} ajustes por defecto`);
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
