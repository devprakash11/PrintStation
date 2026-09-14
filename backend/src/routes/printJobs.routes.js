import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { pool, query } from '../db/pool.js';

const router = Router();
const jobSchema = z.object({
  stationToken: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  storagePath: z.string().min(1).max(1000),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  fileSize: z.number().int().positive().max(100_000_000),
  copies: z.number().int().min(1).max(100).default(1),
  pages: z.number().int().min(1).max(1000).default(1),
  colorMode: z.enum(['color', 'bw']).default('bw'),
  paperSize: z.string().trim().min(1).max(30).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
});

router.post('/public', async (req, res, next) => {
  try {
    const p = jobSchema.parse(req.body);
    const { rows } = await query(
      `SELECT p.id,p.status,p.is_enabled
       FROM qr_codes q
       JOIN printers p ON p.id=q.printer_id
       WHERE q.token=$1 AND q.is_active=true AND (q.expires_at IS NULL OR q.expires_at>now())`,
      [p.stationToken],
    );
    const printer = rows[0];
    if (!printer || !printer.is_enabled || printer.status !== 'online') {
      return res.status(409).json({ success: false, message: 'Printer is currently unavailable.' });
    }

    const jobId = crypto.randomUUID();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const uploadResult = await client.query(
        `SELECT id,storage_path,file_name,mime_type,file_size
         FROM upload_assets
         WHERE storage_path=$1 AND used_at IS NULL AND expires_at>now()
         FOR UPDATE`,
        [p.storagePath],
      );
      const upload = uploadResult.rows[0];
      if (!upload) {
        const error = new Error('Uploaded file is invalid, expired, or already used.');
        error.status = 400;
        throw error;
      }

      if (upload.mime_type !== p.mimeType || Number(upload.file_size) !== p.fileSize) {
        const error = new Error('Uploaded file metadata does not match the stored file.');
        error.status = 400;
        throw error;
      }

      await client.query(
        `INSERT INTO print_jobs(id,printer_id,copies,pages,color_mode,paper_size,orientation,status)
         VALUES($1,$2,$3,$4,$5,$6,$7,'queued')`,
        [jobId, printer.id, p.copies, p.pages, p.colorMode, p.paperSize, p.orientation],
      );

      await client.query(
        `INSERT INTO print_job_files(print_job_id,file_name,storage_path,mime_type,file_size)
         VALUES($1,$2,$3,$4,$5)`,
        [jobId, upload.file_name, upload.storage_path, upload.mime_type, upload.file_size],
      );

      await client.query('UPDATE upload_assets SET used_at=now() WHERE id=$1', [upload.id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.status(201).json({ success: true, data: { jobId, status: 'queued' } });
  } catch (e) { next(e); }
});

router.use(requireAuth, requireRoles('admin', 'staff', 'operator'));

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT j.*,p.name printer_name,f.file_name
      FROM print_jobs j
      JOIN printers p ON p.id=j.printer_id
      LEFT JOIN print_job_files f ON f.print_job_id=j.id
      ORDER BY j.created_at DESC LIMIT 200
    `);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT j.*,p.name printer_name,f.file_name,f.storage_path,f.mime_type
      FROM print_jobs j
      JOIN printers p ON p.id=j.printer_id
      LEFT JOIN print_job_files f ON f.print_job_id=j.id
      WHERE j.id=$1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Print job not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const { rows } = await query(`
      UPDATE print_jobs
      SET status='cancelled',updated_at=now(),completed_at=COALESCE(completed_at,now())
      WHERE id=$1 AND status='queued'
      RETURNING *
    `, [req.params.id]);
    if (!rows[0]) return res.status(409).json({ success: false, message: 'Job cannot be cancelled now.' });
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

export default router;
