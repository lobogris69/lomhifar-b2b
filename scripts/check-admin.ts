import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const p = new PrismaClient();
(async () => {
  const u = await p.adminUser.findUnique({ where: { email: 'admin@lomhifar.com' } });
  console.log('Admin in DB:', u ? { id: u.id, email: u.email, hashLen: u.passwordHash.length } : 'NOT FOUND');
  if (u) {
    const tries = ['admin1234', 'ChangeMe!2025', 'admin'];
    for (const t of tries) {
      const ok = await bcrypt.compare(t, u.passwordHash);
      console.log(`  '${t}' →`, ok ? '✅ MATCH' : '❌');
    }
  }
  await p.$disconnect();
})();
