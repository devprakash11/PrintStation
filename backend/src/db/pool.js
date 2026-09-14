import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;
export const pool = new Pool({ connectionString: env.databaseUrl, max: 10, ssl: env.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false } });

export const query = (text, params = []) => pool.query(text, params);
