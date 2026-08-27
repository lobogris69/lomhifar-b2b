import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { canAccessPath } from '@/lib/admin-roles';
import { ORDER_STATUS_LABEL } from '@/components/shop/OrderStatusBadge';
import { colorLabel } from '@/lib/cart';
import { OrderStatus } from '@/lib/enums';

export const dynamic = 'force-dynamic';

/**
 * Exporta pedidos a CSV (compatible Excel español: ; separador, UTF-8 BOM).
 * Acepta filtros: ?status=X & q=texto & from=YYYY-MM-DD & to=YYYY-MM-DD
 * Una FILA POR LÍNEA DE PEDIDO (cada pulsera de cada pedido = una fila),
 * para que sea trivial calcular totales por color, persona grabada, etc.
 */
export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  // Las rutas /api no pasan por el middleware del panel, así que aquí se
  // repite la comprobación: quien no puede abrir /admin/pedidos tampoco
  // puede descargárselo por la puerta de atrás.
  if (!canAccessPath(session.role, '/admin/pedidos')) {
    return new NextResponse('Sin permiso', { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? '';
  const q = (url.searchParams.get('q') ?? '').trim();
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    const num = Number(q);
    where.OR = [
      { pharmacyName: { contains: q } },
      { cif: { contains: q } },
      { email: { contains: q } },
      ...(Number.isFinite(num) ? [{ number: num }] : []),
    ];
  }
  const createdAt: Record<string, Date> = {};
  if (from) createdAt.gte = new Date(from);
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    createdAt.lte = d;
  }
  if (Object.keys(createdAt).length) where.createdAt = createdAt;

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  // CSV header
  const headers = [
    'N.º Pedido',
    'Fecha',
    'Hora',
    'Estado',
    'Farmacia',
    'CIF',
    'Email',
    'Teléfono',
    'Dirección',
    'Localidad',
    'CP',
    'Provincia',
    'Color',
    'Unidades',
    'Línea 1',
    'Línea 2',
    'Línea 3',
    'Precio ud (€)',
    'Subtotal línea (€)',
    'Subtotal pedido (€)',
    'Portes (€)',
    'Total pedido (€)',
    'Comentario cliente',
    'Notas internas',
  ];

  const rows: string[][] = [];
  for (const o of orders) {
    const statusLabel = ORDER_STATUS_LABEL[o.status as OrderStatus] ?? o.status;
    const fecha = o.createdAt.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });
    const hora = o.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
    for (const it of o.items) {
      rows.push([
        String(o.number),
        fecha,
        hora,
        statusLabel,
        o.pharmacyName,
        o.cif,
        o.email,
        o.phone ?? '',
        o.address ?? '',
        o.city ?? '',
        o.postalCode ?? '',
        o.province ?? '',
        colorLabel(it.color),
        String(it.quantity),
        it.line1,
        it.line2,
        it.line3 ?? '',
        cents(it.unitPriceCents),
        cents(it.lineTotalCents),
        cents(o.subtotalCents),
        cents(o.shippingCents),
        cents(o.totalCents),
        o.customerNote ?? '',
        o.adminNotes ?? '',
      ]);
    }
  }

  const csv = [headers, ...rows].map(rowToCsv).join('\r\n');
  // BOM para que Excel español detecte UTF-8 correctamente
  const body = '﻿' + csv;

  const today = new Date().toISOString().slice(0, 10);
  const filename = `pedidos-lomhifar-${today}.csv`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

function cents(c: number): string {
  // formato español: coma decimal, sin separador miles
  return (c / 100).toFixed(2).replace('.', ',');
}

function rowToCsv(row: string[]): string {
  return row.map(csvEscape).join(';');
}

function csvEscape(value: string): string {
  if (value == null) return '';
  const s = String(value);
  // Si contiene ; " \n -> entrecomillar y escapar comillas dobles
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
