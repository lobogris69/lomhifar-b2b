/**
 * Tipos de dominio. En PostgreSQL se modelarían como `enum` Prisma
 * pero SQLite no los soporta, así que los definimos aquí como uniones.
 * Los valores DEBEN coincidir con los strings almacenados en BD.
 */

export type BraceletColor = 'BLACK' | 'RED';
export const BRACELET_COLORS: BraceletColor[] = ['BLACK', 'RED'];

export type OrderStatus =
  | 'RECEIVED'
  | 'IN_PREPARATION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';
export const ORDER_STATUSES: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type CustomerSource = 'EXCEL' | 'APPLICATION' | 'MANUAL';
