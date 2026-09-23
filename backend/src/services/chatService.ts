import { getDb, withTransaction } from '../config/database.js';
import type { OrderMessage } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { getAuthUser } from '../middleware/auth.js';
import { findOrderById } from '../repositories/orderRepository.js';
import {
  createOrderMessage,
  getOrderMessages,
  markOrderMessagesRead,
  getUnreadCountForOrder,
} from '../repositories/chatRepository.js';

export function sendOrderMessage(
  orderId: number,
  userId: number,
  message: string
): OrderMessage {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | { id: number; customer_id: number; technician_id: number | null }
    | undefined;

  if (!order) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404);
  }

  const isParticipant =
    order.customer_id === userId || order.technician_id === userId;
  if (!isParticipant) {
    throw new AppError('FORBIDDEN', 'Bạn không tham gia đơn này.', 403);
  }

  return createOrderMessage(orderId, userId, message);
}

export function listOrderMessages(orderId: number, userId: number): Array<
  OrderMessage & { sender_name: string }
> {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | { id: number; customer_id: number; technician_id: number | null }
    | undefined;

  if (!order) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404);
  }

  const isParticipant =
    order.customer_id === userId || order.technician_id === userId;
  if (!isParticipant) {
    throw new AppError('FORBIDDEN', 'Bạn không tham gia đơn này.', 403);
  }

  return getOrderMessages(orderId);
}

export function markMessagesRead(orderId: number, userId: number): void {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | { id: number; customer_id: number; technician_id: number | null }
    | undefined;

  if (!order) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404);
  }

  const isParticipant =
    order.customer_id === userId || order.technician_id === userId;
  if (!isParticipant) {
    throw new AppError('FORBIDDEN', 'Bạn không tham gia đơn này.', 403);
  }

  markOrderMessagesRead(orderId, userId);
}

export function getOrderUnreadCount(orderId: number, userId: number): number {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | { id: number; customer_id: number; technician_id: number | null }
    | undefined;

  if (!order) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404);
  }

  const isParticipant =
    order.customer_id === userId || order.technician_id === userId;
  if (!isParticipant) {
    throw new AppError('FORBIDDEN', 'Bạn không tham gia đơn này.', 403);
  }

  return getUnreadCountForOrder(orderId, userId);
}