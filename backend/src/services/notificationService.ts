import { getDb } from '../config/database.js';
import type { NotificationRecord } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { getAuthUser } from '../middleware/auth.js';
import { findOrderById } from '../repositories/orderRepository.js';
import {
  createNotification,
  getNotificationsByUser,
  markNotificationRead,
  getUnreadNotificationCount,
} from '../repositories/notificationReviewRepository.js';

export function sendOrderNotification(
  userId: number,
  orderId: number,
  type: string,
  title: string,
  content: string
): NotificationRecord {
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
    // Cho phép Quản lý hoặc Admin nhận thông báo (ví dụ tin nhắn chat trong đơn chưa gán KTV)
    const recipient = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId) as { id: number; role: string } | undefined;
    if (!recipient || !['MANAGER', 'ADMIN'].includes(recipient.role)) {
      throw new AppError('FORBIDDEN', 'Bạn không tham gia đơn này.', 403);
    }
  }

  return createNotification(userId, orderId, type, title, content);
}

export function listMyNotifications(
  userId: number,
  opts?: { unreadOnly?: boolean; limit?: number; offset?: number }
): NotificationRecord[] {
  return getNotificationsByUser(userId, opts);
}

export function markAsRead(notificationId: number, userId: number): void {
  const db = getDb();
  const notif = db
    .prepare('SELECT * FROM notifications WHERE id = ?')
    .get(notificationId) as
    | { id: number; user_id: number }
    | undefined;

  if (!notif) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy thông báo.', 404);
  }

  if (notif.user_id !== userId) {
    throw new AppError('FORBIDDEN', 'Bạn không có quyền truy cập thông báo này.', 403);
  }

  markNotificationRead(notificationId, userId);
}

export function getUnreadCount(userId: number): number {
  return getUnreadNotificationCount(userId);
}