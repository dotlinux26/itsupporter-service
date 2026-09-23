import fs from 'node:fs';
import path from 'node:path';
import { getDb, closeDb } from '../config/database.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export async function backupDatabase(): Promise<string> {
  const db = getDb();
  fs.mkdirSync(config.backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(config.backupDir, `itsupporter-${stamp}.sqlite`);

  await db.backup(backupPath);
  logger.info({ backupPath }, 'Database backup created');
  return backupPath;
}

const isMain = process.argv[1] !== undefined && process.argv[1].endsWith('backup.ts');
if (isMain) {
  backupDatabase()
    .then((p) => console.log(`Backup created: ${p}`))
    .catch((err) => {
      console.error('Backup failed:', err);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}