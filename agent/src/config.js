import fs from 'node:fs';
import path from 'node:path';
import 'node:process';

const dataDir = path.resolve(process.env.AGENT_DATA_DIR || './data');
const credentialsFile = path.join(dataDir, 'agent.json');

let stored = {};
try {
  stored = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
} catch {
  stored = {};
}

export const config = {
  apiUrl: process.env.PRINTSTATION_API_URL || 'http://localhost:5000',
  wsUrl: process.env.PRINTSTATION_WS_URL || 'ws://localhost:5000/ws/agent',
  agentId: process.env.AGENT_ID?.trim() || stored.agentId || '',
  agentSecret: process.env.AGENT_SECRET?.trim() || stored.agentSecret || '',
  agentName: process.env.AGENT_NAME || stored.agentName || process.env.COMPUTERNAME || 'PrintStation Agent',
  heartbeatMs: Number(process.env.HEARTBEAT_INTERVAL_MS || 15000),
  jobPollMs: Number(process.env.JOB_POLL_INTERVAL_MS || 10000),
  downloadDir: process.env.DOWNLOAD_DIR || './data/jobs',
  dataDir,
  credentialsFile,
};

export function isPaired() {
  return Boolean(config.agentId && config.agentSecret);
}

export function saveCredentials({ agentId, agentSecret, agentName }) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const credentials = {
    agentId,
    agentSecret,
    agentName: agentName || config.agentName,
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(config.credentialsFile, JSON.stringify(credentials, null, 2), { encoding: 'utf8', mode: 0o600 });
  config.agentId = credentials.agentId;
  config.agentSecret = credentials.agentSecret;
  config.agentName = credentials.agentName;
}
