import http from 'node:http';
import { WebSocketServer } from 'ws';
import app from './app.js';
import { env } from './config/env.js';
import { registerAgentSocket } from './services/agentService.js';

const server=http.createServer(app);
const wss=new WebSocketServer({server,path:'/ws/agent'});
wss.on('connection',registerAgentSocket);
server.listen(env.port,()=>console.log(`PrintStation API listening on :${env.port}`));
process.on('SIGTERM',async()=>{server.close(()=>process.exit(0));});
