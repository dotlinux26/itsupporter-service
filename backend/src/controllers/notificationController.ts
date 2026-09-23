import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { getAuthUser } from '../middleware/auth.js';
import {
  listMyNotifications,
  markAsRead,
  getUnreadCount,
} from '../services/notificationService.js';

export function listNotificationsHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const unreadOnly = req.query.unread === 'true';
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const notifications = listMyNotifications(user.id, { unreadOnly, limit, offset });
    res.json({ data: notifications });
  } catch (err) {
    next(err);
  }
}

export function markNotificationReadHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new AppError('VALIDATION_ERROR', 'Mã thông báo không hợp lệ.', 400);
    }
    markAsRead(id, user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export function getUnreadCountHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const count = getUnreadCount(user.id);
    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
}