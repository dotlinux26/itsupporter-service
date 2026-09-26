import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import config from './config/index.js';
import logger from './utils/logger.js';
import { localeMiddleware } from './middleware/locale.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reviewRoutes from './routes/review.routes.js';
import technicianRoutes from './routes/technician.routes.js';
import managerRoutes from './routes/manager.routes.js';
import adminRoutes from './routes/admin.routes.js';
import voucherRoutes from './routes/voucher.routes.js';
import publicRoutes from './routes/public.routes.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (config.corsOrigin.includes(origin)) return callback(null, true);
      // In development, allow localhost & 127.0.0.1 on any port (5172, 5173, etc.)
      if (!config.isProd && (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(localeMiddleware);
app.use(
  pinoHttp({
    logger,
    autoLogging: config.isProd,
    customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : 'info'),
  })
);

app.use('/uploads', express.static(config.uploadDir));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

app.get('/api/avatar', async (req, res) => {
  const name = typeof req.query.name === 'string' ? req.query.name : null;
  const email = typeof req.query.email === 'string' ? req.query.email : null;
  const size = Number(req.query.size) || 100;
  const { generateAvatarSvg } = await import('./utils/avatar.js');
  const svg = generateAvatarSvg(name, email, size);
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

app.use('/api', apiRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders', chatRoutes);
app.use('/api', notificationRoutes);
app.use('/api', reviewRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/public', publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;