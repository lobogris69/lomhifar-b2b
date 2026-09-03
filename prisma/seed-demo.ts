/**
 * Seed extra: farmacias demo. Ejecuta DESPUÉS de prisma/seed.ts
 *
 * Van marcadas como isTest=true a propósito: son las cuentas que usan los
 * COMERCIALES para trastear la tienda sin ensuciar estadísticas ni stock.
 * Los comerciales entran en /acceso con el CIF + email de abajo y la clave
 * demo (variable DEMO_ACCESS_CODE en Railway). Ver acceso/actions.ts.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_CUSTOMERS = [
  {
    cif: 'B12345678',
    email: 'demo@farmaciacentral.es',
    pharmacyName: 'Farmacia Central (DEMO comerciales)',
    contactName: 'María García',
    phone: '911234567',
    address: 'Calle Mayor 25',
    city: 'Madrid',
    postalCode: '28013',
    province: 'Madrid',
    active: true,
    isTest: true,
    source: 'EXCEL' as const,
  },
  {
    cif: 'B87654321',
    email: 'info@farmacialaplaza.com',
    pharmacyName: 'Farmacia La Plaza (DEMO comerciales)',
    contactName: 'Juan López',
    phone: '933456789',
    address: 'Av. Diagonal 100',
    city: 'Barcelona',
    postalCode: '08018',
    province: 'Barcelona',
    active: true,
    isTest: true,
    source: 'EXCEL' as const,
  },
];

async function main() {
  for (const c of DEMO_CUSTOMERS) {
    await prisma.customer.upsert({
      where: { cif: c.cif },
      create: c,
      update: c,
    });
    console.log(`✔ Demo: ${c.pharmacyName} (${c.cif} / ${c.email})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
