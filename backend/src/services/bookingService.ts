import { getDb, withTransaction } from '../config/database.js';
import type { OrderRow } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import {
  buildSlots,
  getActiveTechIds,
  getAvailableTechnicians,
  isTechnicianAvailable,
  generateOrderCode,
} from './calendarService.js';
import { getSystemSettings } from './settingsService.js';
import {
  createOrderRow,
  logStatusChange,
  updateOrder,
} from '../repositories/orderRepository.js';
import { sendOrderNotification } from './notificationService.js';
import { notifyNewOrder } from './telegramService.js';

export type SlotFormat = { start: string; end: string };

export interface BookingInput {
  customerId: number;
  packageId: number;
  scheduledDate: string; // YYYY-MM-DD
  scheduledStart: string; // HH:MM
  requestedTechnicianId?: number | null;
  location: string;
  note?: string | null;
}

export function buildSlotsForDate(): SlotFormat[] {
  return buildSlots();
}

export function listAvailableTechnicians(date: string, start: string) {
  const techIds = getActiveTechIds();
  const available = getAvailableTechnicians(date, start);
  return { all: techIds.length, available: available.length };
}

export function isSlotBookable(date: string, start: string): boolean {
  return getAvailableTechnicians(date, start).length > 0 || getActiveTechIds().length > 0;
}

export function validateBookingInput(input: BookingInput): void {
  if (!input.packageId) {
    throw new AppError('VALIDATION_ERROR', 'Vui lòng chọn gói dịch vụ.', 400);
  }
  if (!/^\d{2}:\d{2}$/.test(input.scheduledStart)) {
    throw new AppError('VALIDATION_ERROR', 'Slot bắt đầu không hợp lệ.', 400);
  }
  if (!input.location || !input.location.trim()) {
    input.location = getSystemSettings().workshopAddress || 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội';
  }

  // Quy định nghiệp vụ: Đặt lịch trước tối thiểu 4 tiếng so với giờ bắt đầu ca
  if (input.scheduledDate && input.scheduledStart) {
    const [year, month, day] = input.scheduledDate.split('-').map(Number);
    const [hour, minute] = input.scheduledStart.split(':').map(Number);
    if (year && month && day && !isNaN(hour) && !isNaN(minute)) {
      const scheduledTime = new Date(year, month - 1, day, hour, minute, 0, 0);
      const now = new Date();
      const diffMs = scheduledTime.getTime() - now.getTime();
      const minAdvanceMs = 4 * 60 * 60 * 1000; // 4 hours in ms
      if (diffMs < minAdvanceMs) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Quý khách cần đặt lịch trước tối thiểu 4 tiếng so với giờ bắt đầu ca dịch vụ.',
          400
        );
      }
    }
  }
}

export function bookOrder(input: BookingInput): OrderRow {
  const db = getDb();
  validateBookingInput(input);
  if (input.requestedTechnicianId != null && !isTechnicianAvailable(input.requestedTechnicianId, input.scheduledDate, input.scheduledStart)) {
    throw new AppError('CONFLICT', 'Kỹ thuật viên không khả dụng trong slot này.', 409);
  }

  const slots = buildSlots();
  const slot = slots.find((s) => s.start === input.scheduledStart);
  if (!slot) {
    throw new AppError('VALIDATION_ERROR', 'Slot không tồn tại trong khung làm việc.', 400);
  }

  const order = withTransaction(() => {
    const pkg = db
      .prepare('SELECT price FROM service_packages WHERE id = ? AND is_active = 1')
      .get(input.packageId) as { price: number } | undefined;
    if (!pkg) {
      throw new AppError('NOT_FOUND', 'Gói dịch vụ không tồn tại hoặc đã bị tắt.', 404);
    }
    const tempCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const orderId = createOrderRow({
      code: tempCode,
      customer_id: input.customerId,
      technician_id: input.requestedTechnicianId ?? null,
      package_id: input.packageId,
      scheduled_date: input.scheduledDate,
      scheduled_start: input.scheduledStart,
      scheduled_end: slot.end,
      location: input.location.trim(),
      note: input.note ?? null,
      price: pkg.price,
      penalty: 0,
      penalty_percent: 0,
      discount: 0,
      extend_fee: 0,
      final_amount: pkg.price,
      status: 'PENDING',
      completion_result: null,
      payment_status: 'UNPAID',
      unpaid_reason: null,
      started_at: null,
      completed_at: null,
    });

    const realCode = generateOrderCode(orderId);
    db.prepare('UPDATE orders SET code = ? WHERE id = ?').run(realCode, orderId);
    logStatusChange(orderId, null, 'PENDING', input.customerId, 'Khách đặt lịch');

    try {
      sendOrderNotification(
        input.customerId,
        orderId,
        'ORDER_CREATED',
        'Đặt lịch dịch vụ thành công!',
        `Đơn hàng ${realCode} đã được tạo và đang chờ Kỹ thuật viên tiếp nhận.`
      );
      if (input.requestedTechnicianId) {
        sendOrderNotification(
          input.requestedTechnicianId,
          orderId,
          'ORDER_CREATED',
          'Có lịch đặt mới được chỉ định!',
          `Khách hàng vừa đặt lịch đơn ${realCode} vào lúc ${input.scheduledStart} ngày ${input.scheduledDate}.`
        );
      }
    } catch (e) {
      console.error('Failed to notify booking:', e);
    }

    return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow;
  });

  try {
    notifyNewOrder(order.id).catch((err) => {
      console.error('Failed to notify Telegram for new order:', err);
    });
  } catch {}

  return order;
}

