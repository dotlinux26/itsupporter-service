import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { getAuthUser } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  createReviewForOrder,
  listMyReviews,
  listTechnicianReviews,
  getOrderReview,
} from '../services/reviewService.js';

export function createReviewHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const orderId = Number(req.body.orderId);
    if (!Number.isInteger(orderId)) {
      throw new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400);
    }
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating)) {
      throw new AppError('VALIDATION_ERROR', 'Đánh giá phải là số nguyên.', 400);
    }
    const content = String(req.body.content ?? '').trim();
    if (!content) {
      throw new AppError('VALIDATION_ERROR', 'Nội dung đánh giá không được rỗng.', 400);
    }
    const review = createReviewForOrder(orderId, user.id, rating, content);
    res.status(201).json({ data: review });
  } catch (err) {
    next(err);
  }
}

export function listMyReviewsHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const reviews = listMyReviews(user.id);
    res.json({ data: reviews });
  } catch (err) {
    next(err);
  }
}

export function listTechnicianReviewsHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const technicianId = Number(req.params.technicianId);
    if (!Number.isInteger(technicianId)) {
      throw new AppError('VALIDATION_ERROR', 'Mã kỹ thuật viên không hợp lệ.', 400);
    }
    const reviews = listTechnicianReviews(technicianId);
    res.json({ data: reviews });
  } catch (err) {
    next(err);
  }
}

export function getOrderReviewHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) {
      throw new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400);
    }
    const review = getOrderReview(orderId);
    if (!review) {
      throw new AppError('NOT_FOUND', 'Đơn này chưa được đánh giá.', 404);
    }
    res.json({ data: review });
  } catch (err) {
    next(err);
  }
}