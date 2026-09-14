import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '../..');

try {
  const schema = await fs.readFile(path.join(backendRoot, 'sql/schema.sql'), 'utf8');
  const hardening = await fs.readFile(path.join(backendRoot, 'sql/migrations/001_production_hardening.sql'), 'utf8');
  await pool.query(schema);
  await pool.query(hardening);
  console.log('[db] schema and production migrations applied successfully.');
} catch (error) {
  console.error('[db] migration failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
