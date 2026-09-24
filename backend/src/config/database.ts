import type Database from 'better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

  db = new BetterSqlite3(config.databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = FULL');

  logger.info({ path: config.databasePath }, 'SQLite connected');

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export type DbConnection = Database.Database;

export function withTransaction<T>(fn: () => T): T {
  const database = getDb();
  const tx = database.transaction(fn);
  return tx();
}