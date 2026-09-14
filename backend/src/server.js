import http from 'node:http';
import { WebSocketServer } from 'ws';
import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { registerAgentSocket } from './services/agentService.js';

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/agent' });
wss.on('connection', registerAgentSocket);
wss.on('error', (error) => console.error('[ws] server error:', error));

server.listen(env.port, () => console.log(`PrintStation API listening on :${env.port}`));

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received, shutting down...`);

  for (const client of wss.clients) {
    try { client.close(1001, 'Server shutting down'); } catch {}
  }
  wss.close();

  await new Promise((resolve) => server.close(resolve));
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
