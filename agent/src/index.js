import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AgentClient } from './agentClient.js';
import { config, isPaired, saveCredentials } from './config.js';

const UI_DIR = path.resolve('ui');
const UI_PORT = Number(process.env.AGENT_UI_PORT || 47821);
const agent = new AgentClient();

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  if (body.length > 16_384) throw Object.assign(new Error('Request body is too large.'), { status: 413 });
  return body ? JSON.parse(body) : {};
}

async function pair(body) {
  const code = String(body.code || '').trim().toUpperCase();
  const name = String(body.name || config.agentName).trim();
  if (!code) throw Object.assign(new Error('Enter the pairing code from Admin → Printer Agents.'), { status: 400 });
  if (!name) throw Object.assign(new Error('Agent name is required.'), { status: 400 });

  const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/api/v1/agents/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, platform: process.platform === 'win32' ? 'windows' : process.platform }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(data?.message || `Pairing failed (${response.status}).`), { status: response.status });

  saveCredentials({ agentId: data.data.id, agentSecret: data.data.secret, agentName: data.data.name });
  agent.start();
  return data;
}

async function handleApi(req, res, url) {
  try {
    if (req.method === 'GET' && url.pathname === '/api/status') return json(res, 200, { success: true, data: agent.getState() });

    if (req.method === 'POST' && url.pathname === '/api/pair') {
      const result = await pair(await readBody(req));
      return json(res, 201, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/refresh') {
      await agent.syncPrinters();
      return json(res, 200, { success: true, data: agent.getState() });
    }

    if (req.method === 'POST' && url.pathname === '/api/connect') {
      if (!isPaired()) return json(res, 400, { success: false, message: 'Pair the Agent first.' });
      agent.stop();
      agent.start();
      return json(res, 200, { success: true, data: agent.getState() });
    }

    return json(res, 404, { success: false, message: 'Not found.' });
  } catch (error) {
    json(res, error.status || 500, { success: false, message: error.message || 'Request failed.' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);

  const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const safePath = path.resolve(UI_DIR, requested);
  if (!safePath.startsWith(UI_DIR + path.sep)) return json(res, 400, { success: false, message: 'Invalid path.' });

  try {
    const data = await fs.readFile(safePath);
    const ext = path.extname(safePath);
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    json(res, 404, { success: false, message: 'UI file not found.' });
  }
});

server.listen(UI_PORT, '127.0.0.1', () => {
  console.log(`Agent UI: http://127.0.0.1:${UI_PORT}`);
  console.log(`Name: ${config.agentName}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Backend: ${config.apiUrl}`);
  if (isPaired()) {
    console.log('Stored credentials found. Starting Agent connection...');
    agent.start();
  } else {
    console.log('Agent is not paired. Open the Agent UI and enter the pairing code.');
  }
});

const shutdown = () => {
  console.log('[agent] shutting down...');
  agent.stop();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
