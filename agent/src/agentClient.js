import os from 'node:os';
import WebSocket from 'ws';
import { config } from './config.js';
import { discoverPrinters, printFile } from './printerService.js';

export class AgentClient {
  constructor() {
    this.ws = null;
    this.closed = false;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.printerTimer = null;
  }

  start() {
    this.closed = false;
    this.connect();
  }

  stop() {
    this.closed = true;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.heartbeatTimer);
    clearInterval(this.printerTimer);
    this.ws?.close();
  }

  connect() {
    if (this.closed) return;
    console.log(`Connecting to PrintStation Agent API: ${config.wsUrl}`);
    this.ws = new WebSocket(config.wsUrl);
    this.ws.on('open', () => this.authenticate());
    this.ws.on('message', (raw) => this.handleMessage(raw));
    this.ws.on('error', (error) => console.error('[agent] WebSocket error:', error.message));
    this.ws.on('close', (code, reason) => {
      clearInterval(this.heartbeatTimer);
      clearInterval(this.printerTimer);
      console.warn(`[agent] disconnected (${code}) ${reason?.toString() || ''}`);
      if (!this.closed) this.scheduleReconnect();
    });
  }

  authenticate() {
    this.send({ type: 'authenticate', agentId: config.agentId, secret: config.agentSecret });
  }

  async handleMessage(raw) {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    if (message.type === 'authenticated') {
      console.log(`[agent] authenticated as ${message.agentId}`);
      clearInterval(this.heartbeatTimer);
      clearInterval(this.printerTimer);
      this.heartbeatTimer = setInterval(() => this.send({ type: 'heartbeat' }), config.heartbeatMs);
      await this.syncPrinters();
      this.printerTimer = setInterval(() => this.syncPrinters(), config.jobPollMs);
      return;
    }
    if (message.type === 'print_job') {
      await this.handlePrintJob(message.job);
      return;
    }
    if (message.type === 'error') console.error('[agent] server error:', message.message);
  }

  async syncPrinters() {
    if (!this.isOpen()) return;
    try {
      const printers = await discoverPrinters();
      this.send({ type: 'printers', printers });
    } catch (error) {
      console.error('[agent] printer discovery failed:', error.message);
    }
  }

  async handlePrintJob(job) {
    if (!job?.job_id || !job?.file_path) {
      this.send({ type: 'job_status', jobId: job?.job_id, status: 'failed', error: 'Agent requires a local file_path to print.' });
      return;
    }
    try {
      this.send({ type: 'job_status', jobId: job.job_id, status: 'downloading' });
      this.send({ type: 'job_status', jobId: job.job_id, status: 'printing' });
      await printFile(job.file_path, job.system_printer_name, job.copies);
      this.send({ type: 'job_status', jobId: job.job_id, status: 'completed' });
    } catch (error) {
      this.send({ type: 'job_status', jobId: job.job_id, status: 'failed', error: error.message });
    }
  }

  send(message) {
    if (this.isOpen()) this.ws.send(JSON.stringify(message));
  }

  isOpen() { return this.ws?.readyState === WebSocket.OPEN; }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }

  getSystemInfo() {
    return { hostname: os.hostname(), platform: process.platform, arch: process.arch };
  }
}
