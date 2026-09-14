import crypto from 'node:crypto';
import { query } from '../db/pool.js';
import { env } from '../config/env.js';

const hashSecret = value => crypto.createHmac('sha256', env.agentSecretPepper).update(value).digest('hex');
const makeSecret = () => crypto.randomBytes(32).toString('hex');

export async function pairAgent(code, name, platform) {
  const client = await (await import('../db/pool.js')).pool.connect();
  try {
    await client.query('BEGIN');
    const pairing = (await client.query(`SELECT id FROM agent_pairings WHERE code=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE`, [code])).rows[0];
    if (!pairing) throw Object.assign(new Error('Pairing code is invalid or expired.'), { status: 400 });
    const secret = makeSecret();
    const agent = (await client.query(`INSERT INTO printer_agents(name,machine_name,platform,secret_hash,status) VALUES($1,$1,$2,$3,'offline') RETURNING id,name,machine_name,platform,status`, [name, name, platform, hashSecret(secret)])).rows[0];
    await client.query('UPDATE agent_pairings SET used_at=now() WHERE id=$1', [pairing.id]);
    await client.query('COMMIT');
    return { ...agent, secret };
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

export async function registerAgentSocket(ws) {
  let agentId = null;
  ws.on('message', async raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'authenticate') {
        const rows = (await query(`SELECT id FROM printer_agents WHERE id=$1 AND secret_hash=$2 AND is_active=true`, [msg.agentId, hashSecret(msg.secret)])).rows;
        if (!rows[0]) return ws.close(4001, 'Invalid credentials');
        agentId = msg.agentId;
        ws.agentId = agentId;
        await query(`UPDATE printer_agents SET status='online',last_seen_at=now() WHERE id=$1`, [agentId]);
        ws.send(JSON.stringify({ type:'authenticated', agentId }));
        return sendQueuedJobs(ws, agentId);
      }
      if (!agentId) return ws.close(4001, 'Authenticate first');
      await query(`UPDATE printer_agents SET last_seen_at=now(),status='online' WHERE id=$1`, [agentId]);
      if (msg.type === 'heartbeat') return sendQueuedJobs(ws, agentId);
      if (msg.type === 'printers') {
        for (const p of Array.isArray(msg.printers) ? msg.printers : []) {
          await query(`UPDATE printers SET status=$1,capabilities=$2,last_seen_at=now(),updated_at=now() WHERE agent_id=$3 AND system_printer_name=$4`, [p.status || 'offline', JSON.stringify(p.capabilities || {}), agentId, p.systemPrinterName]);
        }
        return;
      }
      if (msg.type === 'job_status' && msg.jobId) {
        const allowed=['accepted','downloading','printing','completed','failed','cancelled'];
        if (!allowed.includes(msg.status)) return;
        await query(`UPDATE print_jobs SET status=$1,started_at=CASE WHEN $1 IN ('printing','completed') THEN COALESCE(started_at,now()) ELSE started_at END,completed_at=CASE WHEN $1 IN ('completed','failed','cancelled') THEN now() ELSE completed_at END,updated_at=now(),error_message=$2 WHERE id=$3 AND printer_id IN (SELECT id FROM printers WHERE agent_id=$4)`, [msg.status, msg.error || null, msg.jobId, agentId]);
        return sendQueuedJobs(ws, agentId);
      }
    } catch { ws.send(JSON.stringify({type:'error',message:'Invalid agent message.'})); }
  });
  ws.on('close', async()=>{ if(agentId) await query(`UPDATE printer_agents SET status='offline' WHERE id=$1`,[agentId]).catch(()=>{}); });
}

async function sendQueuedJobs(ws, agentId) {
  if (ws.readyState !== 1) return;
  const { rows } = await query(`SELECT j.id job_id,j.printer_id,j.copies,j.pages,j.color_mode,j.paper_size,j.orientation,f.file_name,f.storage_path,f.mime_type FROM print_jobs j JOIN printers p ON p.id=j.printer_id JOIN print_job_files f ON f.print_job_id=j.id WHERE j.status='queued' AND p.agent_id=$1 ORDER BY j.created_at ASC LIMIT 10`, [agentId]);
  for (const job of rows) {
    await query(`UPDATE print_jobs SET status='accepted',updated_at=now() WHERE id=$1 AND status='queued'`, [job.job_id]);
    ws.send(JSON.stringify({type:'print_job',job}));
  }
}
