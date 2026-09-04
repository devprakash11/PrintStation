import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

const server = app.listen(env.port, () => console.log(`PrintStation API running on http://localhost:${env.port}`));

const shutdown = async (signal) => {
  console.log(`${signal}: shutting down...`);
  server.close(async () => { await pool.end(); process.exit(0); });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
