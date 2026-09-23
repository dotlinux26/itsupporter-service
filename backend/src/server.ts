import app from './app.js';
import config from './config/index.js';
import { getDb, closeDb } from './config/database.js';
import logger from './utils/logger.js';
import { runMigrations } from './scripts/migrate.js';
import { ensureUploadDir } from './utils/upload.js';

const server = app.listen(config.port, () => {
  try {
    getDb();
    runMigrations();
    ensureUploadDir();
  } catch (err) {
    logger.error({ err }, 'Startup initialization failed');
  }
  logger.info(`API listening on http://localhost:${config.port} (${config.env})`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));