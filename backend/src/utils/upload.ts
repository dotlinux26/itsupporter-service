import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import config from '../config/index.js';
import { BadRequestError } from './AppError.js';

const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

export const ALLOWED_IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);

export function ensureUploadDir(): string {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  return config.uploadDir;
}

export function safeRandomName(originalName: string, ext?: string): string {
  const parsed = path.parse(originalName);
  const safeExt = ext ? `.${ext.replace(/^\./, '')}` : path.extname(originalName).toLowerCase();
  const name = crypto.randomBytes(16).toString('hex');
  return `${name}${safeExt}`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureUploadDir());
  },
  filename: (_req, file, cb) => {
    const safeName = safeRandomName(file.originalname);
    file.filename = safeName; // multer overrides on disk
    cb(null, safeName);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (!ALLOWED_IMAGE_MIME.has(file.mimetype) || !ALLOWED_IMAGE_EXT.has(path.extname(file.originalname).toLowerCase())) {
    cb(new BadRequestError('Định dạng ảnh không hợp lệ. Chỉ chấp nhận PNG, JPG, WEBP, SVG, GIF.'));
    return;
  }
  cb(null, true);
}

export const imageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
});

export function publicFilePath(filePath: string): string {
  return `/uploads/${path.basename(filePath)}`;
}