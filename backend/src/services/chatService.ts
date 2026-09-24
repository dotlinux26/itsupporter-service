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
import { sendOrderNotification } from './notificationService.js';

function checkOrderAccess(
  order: { id: number; customer_id: number; technician_id: number | null },
  userId: number
): void {
  const db = getDb();
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId) as
    | { id: number; role: string }
    | undefined;

  const isAllowed =
    order.customer_id === userId ||
    order.technician_id === userId ||
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER' ||
    (user?.role === 'TECHNICIAN' && !order.technician_id);

  if (!isAllowed) {
    throw new AppError('FORBIDDEN', 'Bạn không có quyền tham gia khung chat đơn này.', 403);
  }
}

export function sendOrderMessage(
  orderId: number,
  userId: number,
  message: string
): OrderMessage {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | { id: number; code: string; customer_id: number; technician_id: number | null }
    | undefined;

  if (!order) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404);
  }

  checkOrderAccess(order, userId);

  const msg = createOrderMessage(orderId, userId, message);

  // Dispatch notification to recipient
  try {
    const sender = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(userId) as { id: number; name: string; role: string } | undefined;
    const senderName = sender?.name || 'Người dùng';
    const preview = message.length > 70 ? message.slice(0, 70) + '...' : message;

    if (userId === order.customer_id) {
      if (order.technician_id) {
        sendOrderNotification(
          order.technician_id,
          orderId,
          'CHAT',
          `Tin nhắn mới từ ${senderName}`,
          preview
        );
      } else {
        const managers = db.prepare("SELECT id FROM users WHERE role IN ('MANAGER', 'ADMIN') AND is_deleted = 0").all() as { id: number }[];
        for (const m of managers) {
          sendOrderNotification(
            m.id,
            orderId,
            'CHAT',
            `Tin nhắn từ khách ${senderName} (${order.code})`,
            preview
          );
        }
      }
    } else {
      sendOrderNotification(
        order.customer_id,
        orderId,
        'CHAT',
        `${sender?.role === 'TECHNICIAN' ? 'Kỹ thuật viên' : 'Bộ phận hỗ trợ'} ${senderName} đã nhắn tin`,
        preview
      );
    }
  } catch (err) {
    console.error('Failed to send chat notification:', err);
  }

  return msg;
}

export function sendOrderVoucherMessage(
  orderId: number,
  userId: number,
  voucherId: number,
  note?: string
): OrderMessage {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | { id: number; code: string; customer_id: number; technician_id: number | null }
    | undefined;

  if (!order) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404);
  }

  checkOrderAccess(order, userId);

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
  const msg = createOrderMessage(orderId, userId, messageText, 'voucher', voucherId);

  try {
    const sender = db.prepare('SELECT id, name FROM users WHERE id = ?').get(userId) as { id: number; name: string } | undefined;
    const senderName = sender?.name || 'Kỹ thuật viên';
    sendOrderNotification(
      order.customer_id,
      orderId,
      'VOUCHER',
      '🎁 Bạn nhận được Voucher ưu đãi mới!',
      `${senderName} đã gửi tặng bạn mã ${voucher.code} trong đơn ${order.code}.`
    );
  } catch (err) {
    console.error('Failed to send voucher notification:', err);
  }

  return msg;
}

export function listOrderMessages(orderId: number, userId: number): OrderMessage[] {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | { id: number; customer_id: number; technician_id: number | null }
    | undefined;

  if (!order) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404);
  }

  checkOrderAccess(order, userId);

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

  checkOrderAccess(order, userId);

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

  checkOrderAccess(order, userId);

  return getUnreadCountForOrder(orderId, userId);
}