import 'dotenv/config';
import { AgentClient } from './agentClient.js';
import { config } from './config.js';

console.log('========================================');
console.log(' PrintStation Agent');
console.log('========================================');
console.log(`Name: ${config.agentName}`);
console.log(`Platform: ${process.platform}`);
console.log(`WebSocket: ${config.wsUrl}`);

const agent = new AgentClient();
agent.start();

const shutdown = () => {
  console.log('[agent] shutting down...');
  agent.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
