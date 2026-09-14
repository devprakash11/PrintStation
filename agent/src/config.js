import 'node:process';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const config = {
  apiUrl: process.env.PRINTSTATION_API_URL || 'http://localhost:5000',
  wsUrl: process.env.PRINTSTATION_WS_URL || 'ws://localhost:5000/ws/agent',
  agentId: required('AGENT_ID'),
  agentSecret: required('AGENT_SECRET'),
  agentName: process.env.AGENT_NAME || process.env.COMPUTERNAME || 'PrintStation Agent',
  heartbeatMs: Number(process.env.HEARTBEAT_INTERVAL_MS || 15000),
  jobPollMs: Number(process.env.JOB_POLL_INTERVAL_MS || 10000),
  downloadDir: process.env.DOWNLOAD_DIR || './data/jobs',
};
