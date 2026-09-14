import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { authenticateAgent } from '../services/agentService.js';
import { query } from '../db/pool.js';

const router = Router();

router.get('/:jobId', async (req, res, next) => {
  try {
    const agent = await authenticateAgent(req.get('x-agent-id'), req.get('x-agent-secret'));
    if (!agent) return res.status(401).json({ success: false, message: 'Invalid agent credentials.' });

    const { rows } = await query(
      `SELECT f.storage_path,f.file_name,f.mime_type,f.file_size
       FROM print_job_files f
       JOIN print_jobs j ON j.id=f.print_job_id
       JOIN printers p ON p.id=j.printer_id
       WHERE f.print_job_id=$1 AND p.agent_id=$2
       LIMIT 1`,
      [req.params.jobId, agent.id],
    );

    const file = rows[0];
    if (!file) return res.status(404).json({ success: false, message: 'Print job file not found.' });

    const root = path.resolve(env.uploadDir);
    const filePath = path.resolve(root, file.storage_path);
    if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
      return res.status(400).json({ success: false, message: 'Invalid storage path.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Stored print file is missing.' });
    }

    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', String(file.file_size));
    res.setHeader('Content-Disposition', `attachment; filename="${String(file.file_name).replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
    return fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
});

export default router;
