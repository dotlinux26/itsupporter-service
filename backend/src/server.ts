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

function shutdown(signal: string): void {
  try {
    closeDb();
  } catch {}
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));