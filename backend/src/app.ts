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

const app = express();

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
      return callback(new Error('Not allowed by CORS'));
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

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

app.use('/api', apiRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders', chatRoutes);
app.use('/api', notificationRoutes);
app.use('/api', reviewRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;