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

export function sendOrderVoucherMessage(
  orderId: number,
  userId: number,
  voucherId: number,
  note?: string
): OrderMessage {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | { id: number; customer_id: number; technician_id: number | null }
    | undefined;

  if (!order) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404);
  }

  // Only technician, manager or admin can gift a voucher
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId) as { id: number; role: string } | undefined;
  if (!user || (!['TECHNICIAN', 'MANAGER', 'ADMIN'].includes(user.role) && order.technician_id !== userId)) {
    throw new AppError('FORBIDDEN', 'Chỉ kỹ thuật viên hoặc quản lý mới có quyền tặng voucher.', 403);
  }

  const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(voucherId) as
    | { id: number; code: string; customer_id: number | null; status: string }
    | undefined;

  if (!voucher) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy voucher.', 404);
  }

  // Assign voucher to customer if not already assigned
  if (!voucher.customer_id) {
    db.prepare('UPDATE vouchers SET customer_id = ?, technician_id = ?, assigned_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?')
      .run(order.customer_id, userId, voucherId);
  }

  const messageText = note ? note.trim() : `🎁 Đã gửi tặng bạn voucher ưu đãi: ${voucher.code}`;
  return createOrderMessage(orderId, userId, messageText, 'voucher', voucherId);
}

export function listOrderMessages(orderId: number, userId: number): OrderMessage[] {
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