import { getDb } from '../config/database.js';
import type { Review } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { getSystemSettings } from './settingsService.js';
import { findOrderById } from '../repositories/orderRepository.js';
import {
  createReview,
  getReviewsByCustomer,
  getReviewsByTechnician,
  getReviewByOrder,
} from '../repositories/notificationReviewRepository.js';

export function createReviewForOrder(
  orderId: number,
  customerId: number,
  rating: number,
  content: string
): Review {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | { id: number; customer_id: number; technician_id: number | null; status: string }
    | undefined;

  if (!order) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404);
  }

  if (order.customer_id !== customerId) {
    throw new AppError('FORBIDDEN', 'Chỉ khách hàng mới được đánh giá đơn của mình.', 403);
  }

  if (order.status !== 'COMPLETED') {
    throw new AppError('PRE_CONDITION_FAILED', 'Chỉ được đánh giá đơn đã hoàn thành.', 400);
  }

  const existing = db
    .prepare('SELECT * FROM reviews WHERE order_id = ?')
    .get(orderId) as Review | undefined;
  if (existing) {
    throw new AppError('CONFLICT', 'Đơn này đã được đánh giá.', 409);
  }

  const settings = getSystemSettings();
  const minRating = 1;
  const maxRating = 5;
  // const maxRating = settings.maxReviewRating ?? 5;
  // const minRating = settings.minReviewRating ?? 1;
  if (rating < minRating || rating > maxRating) {
    throw new AppError('VALIDATION_ERROR', `Đánh giá phải từ ${minRating} đến ${maxRating} sao.`, 400);
  }

  return createReview(orderId, customerId, order.technician_id, rating, content);
}

export function listMyReviews(customerId: number) {
  return getReviewsByCustomer(customerId);
}

export function listTechnicianReviews(technicianId: number) {
  return getReviewsByTechnician(technicianId);
}

export function getOrderReview(orderId: number): Review | undefined {
  return getReviewByOrder(orderId);
}