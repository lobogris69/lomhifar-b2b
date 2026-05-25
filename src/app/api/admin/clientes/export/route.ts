import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Exporta clientes a CSV (Excel español: ; separador, UTF-8 BOM).
 * Acepta filtros: ?q=texto & status=active|inactive
 */
export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const status = url.searchParams.get('status') ?? '';

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { cif: { contains: q } },
      { email: { contains: q } },
      { pharmacyName: { contains: q } },
      { city: { contains: q } },
    ];
  }
  if (status === 'active') where.active = true;
  if (status === 'inactive') where.active = false;

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { pharmacyName: 'asc' },
    include: { _count: { select: { orders: true } } },
  });

  // CSV header
  const headers = [
    'CIF/NIF',
    'Farmacia',
    'Contacto',
    'Email',
    'Teléfono',
    'WhatsApp',
    'Dirección',
    'Localidad',
    'CP',
    'Provincia',
    'IBAN',
    'Origen',
    'Activo',
    'Pedidos',
    'Alta',
    'Observaciones',
  ];

  const rows: string[][] = customers.map((c) => [
    c.cif,
    c.pharmacyName,
    c.contactName ?? '',
    c.email,
    c.phone ?? '',
    c.whatsapp ?? '',
    c.address ?? '',
    c.city ?? '',
    c.postalCode ?? '',
    c.province ?? '',
    c.bankAccount ?? '',
    sourceLabel(c.source),
    c.active ? 'Sí' : 'No',
    String(c._count.orders),
    c.createdAt.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }),
    c.notes ?? '',
  ]);

  const csv = [headers, ...rows].map(rowToCsv).join('\r\n');
  const body = '﻿' + csv;  // BOM UTF-8

  const today = new Date().toISOString().slice(0, 10);
  const filename = `clientes-lomhifar-${today}.csv`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

function sourceLabel(s: string): string {
  switch (s) {
    case 'EXCEL': return 'Excel';
    case 'APPLICATION': return 'Alta web';
    case 'MANUAL': return 'Manual';
    default: return s;
  }
}

function rowToCsv(row: string[]): string {
  return row.map(csvEscape).join(';');
}

function csvEscape(value: string): string {
  if (value == null) return '';
  const s = String(value);
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
