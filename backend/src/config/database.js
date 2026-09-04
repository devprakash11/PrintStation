import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const useSsl =
  env.nodeEnv === 'production' ||
  (typeof env.databaseUrl === 'string' &&
    (env.databaseUrl.includes('supabase.co') || env.databaseUrl.includes('sslmode=require')));

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: 3,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error:', error));

export async function query(text, params = []) {
  return pool.query(text, params);
}

export default {
  pool,
  query,
};
