import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { getAuthUser } from '../middleware/auth.js';
import {
  sendOrderMessage,
  listOrderMessages,
  markMessagesRead,
  getOrderUnreadCount,
} from '../services/chatService.js';

export function sendMessageHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) {
      throw new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400);
    }
    const message = String(req.body.message ?? '').trim();
    if (!message) {
      throw new AppError('VALIDATION_ERROR', 'Tin nhắn không được rỗng.', 400);
    }
    const msg = sendOrderMessage(orderId, user.id, message);
    res.status(201).json({ data: msg });
  } catch (err) {
    next(err);
  }
}

export function listMessagesHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) {
      throw new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400);
    }
    const messages = listOrderMessages(orderId, user.id);
    res.json({ data: messages });
  } catch (err) {
    next(err);
  }
}

export function markReadHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401);
    }
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) {
      throw new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400);
    }
    markMessagesRead(orderId, user.id);
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
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) {
      throw new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400);
    }
    const count = getOrderUnreadCount(orderId, user.id);
    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
}