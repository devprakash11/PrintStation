import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import WebSocket from 'ws';
import { config } from './config.js';
import { discoverPrinters, printFile } from './printerService.js';

export class AgentClient {
  constructor() {
    this.ws = null;
    this.closed = true;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.printerTimer = null;
    this.activeJobs = new Set();
    this.printers = [];
    this.lastSyncAt = null;
    this.currentJob = null;
    this.logs = [];
    this.connection = 'offline';
  }

  start() {
    this.closed = false;
    this.log('Agent starting');
    this.connect();
  }

  stop() {
    this.closed = true;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.heartbeatTimer);
    clearInterval(this.printerTimer);
    this.ws?.close();
    this.connection = 'offline';
  }

  connect() {
    if (this.closed || !config.agentId || !config.agentSecret) return;
    this.connection = 'connecting';
    console.log(`Connecting to PrintStation API: ${config.wsUrl}`);
    this.ws = new WebSocket(config.wsUrl);
    this.ws.on('open', () => this.authenticate());
    this.ws.on('message', raw => this.handleMessage(raw));
    this.ws.on('error', error => {
      this.connection = 'error';
      this.log(`Connection error: ${error.message}`);
      console.error('[agent] WebSocket error:', error.message);
    });
    this.ws.on('close', (code, reason) => {
      clearInterval(this.heartbeatTimer);
      clearInterval(this.printerTimer);
      this.connection = 'offline';
      this.log(`Disconnected (${code})`);
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
      this.connection = 'online';
      this.log('Connected and authenticated');
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

    if (message.type === 'error') this.log(`Server error: ${message.message}`);
  }

  async syncPrinters() {
    try {
      this.printers = await discoverPrinters();
      this.lastSyncAt = new Date().toISOString();
      if (this.isOpen()) this.send({ type: 'printers', printers: this.printers });
      this.log(`Discovered ${this.printers.length} printer(s)`);
    } catch (error) {
      this.log(`Printer discovery failed: ${error.message}`);
    }
  }

  async downloadJobFile(job) {
    if (!job.download_url) throw new Error('Print job has no download URL.');
    await fs.mkdir(path.resolve(config.downloadDir), { recursive: true });
    const fileName = String(job.file_name || `print-${job.job_id}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const destination = path.resolve(config.downloadDir, `${job.job_id}-${fileName}`);
    const response = await fetch(job.download_url, {
      headers: { 'X-Agent-ID': config.agentId, 'X-Agent-Secret': config.agentSecret },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`File download failed (${response.status})${text ? `: ${text}` : ''}`);
    }
    await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()), { flag: 'wx' });
    return destination;
  }

  async handlePrintJob(job) {
    if (!job?.job_id || !job?.system_printer_name || !job?.download_url) {
      this.send({ type: 'job_status', jobId: job?.job_id, status: 'failed', error: 'Incomplete print job payload.' });
      return;
    }
    if (this.activeJobs.has(job.job_id)) return;

    this.activeJobs.add(job.job_id);
    this.currentJob = { ...job, status: 'downloading' };
    this.log(`Received print job ${job.job_id}`);
    let localFile = null;
    try {
      this.send({ type: 'job_status', jobId: job.job_id, status: 'downloading' });
      localFile = await this.downloadJobFile(job);
      this.currentJob = { ...job, status: 'printing' };
      this.log(`Printing ${job.file_name || job.job_id} on ${job.system_printer_name}`);
      this.send({ type: 'job_status', jobId: job.job_id, status: 'printing' });
      await printFile(localFile, job.system_printer_name, job.copies);
      this.currentJob = null;
      this.send({ type: 'job_status', jobId: job.job_id, status: 'completed' });
      this.log(`Print job ${job.job_id} completed`);
    } catch (error) {
      this.currentJob = { ...job, status: 'failed', error: error.message };
      this.log(`Print job ${job.job_id} failed: ${error.message}`);
      this.send({ type: 'job_status', jobId: job.job_id, status: 'failed', error: error.message });
    } finally {
      this.activeJobs.delete(job.job_id);
      if (localFile) await fs.unlink(localFile).catch(() => {});
      setTimeout(() => { this.currentJob = null; }, 3000);
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

  log(message) {
    this.logs.unshift({ time: new Date().toISOString(), message });
    this.logs = this.logs.slice(0, 30);
  }

  getState() {
    return {
      paired: Boolean(config.agentId && config.agentSecret),
      agentId: config.agentId || null,
      agentName: config.agentName,
      version: '1.0.0',
      connection: this.connection,
      computer: this.getSystemInfo(),
      printers: this.printers,
      currentJob: this.currentJob,
      lastSyncAt: this.lastSyncAt,
      logs: this.logs,
    };
  }

  getSystemInfo() {
    return { hostname: os.hostname(), platform: process.platform, arch: process.arch };
  }
}
