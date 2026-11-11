import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const SCHEMA_VERSION = 2;
export function migrate(db, directory) {
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version > SCHEMA_VERSION) throw new Error(`Database schema ${version} is newer than this CMS supports (${SCHEMA_VERSION}). Restore matching application code; do not downgrade the database.`);
  if (version === SCHEMA_VERSION) return;
  const installed = !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (installed) {
    mkdirSync(join(directory, 'migration-backups'), { recursive: true });
    const target = join(directory, 'migration-backups', `before-schema-${SCHEMA_VERSION}-${Date.now()}.sqlite`);
    db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS page_history (id TEXT PRIMARY KEY, page_id TEXT NOT NULL, created TEXT NOT NULL, actor TEXT NOT NULL, snapshot TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS history_page ON page_history(page_id, created);
      CREATE TABLE IF NOT EXISTS trash (id TEXT PRIMARY KEY, created TEXT NOT NULL, actor TEXT NOT NULL, snapshot TEXT NOT NULL);
      PRAGMA user_version=2;
    `);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
