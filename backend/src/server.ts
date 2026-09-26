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
  logger.info({ signal }, 'Shutting down server cleanly...');
  server.close(() => {
    try {
      closeDb();
    } catch {}
    process.exitCode = 0;
  });
  // Fallback timeout only if server doesn't close within 5s
  setTimeout(() => {
    try {
      closeDb();
    } catch {}
    process.exit(0);
  }, 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));