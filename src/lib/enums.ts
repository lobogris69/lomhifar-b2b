/**
 * Tipos de dominio. Los valores DEBEN coincidir con los strings almacenados en BD.
 */

export type BraceletColor = 'BLACK' | 'RED';
export const BRACELET_COLORS: BraceletColor[] = ['BLACK', 'RED'];

export type OrderStatus =
  | 'RECEIVED'
  | 'ON_HOLD'
  | 'IN_PREPARATION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'INVOICED'
  | 'CANCELLED';
export const ORDER_STATUSES: OrderStatus[] = [
  'RECEIVED',
  'ON_HOLD',
  'IN_PREPARATION',
  'SHIPPED',
  'DELIVERED',
  'INVOICED',
  'CANCELLED',
];

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type CustomerSource = 'EXCEL' | 'APPLICATION' | 'MANUAL';
