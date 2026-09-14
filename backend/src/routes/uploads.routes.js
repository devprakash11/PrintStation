import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { uploadPrintFile } from '../storage/supabaseStorage.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: 1 },
});

function safeFileName(name) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function detectFileType(buffer) {
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required.' });

    const detectedMime = detectFileType(req.file.buffer);
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
    if (!detectedMime || !allowed.has(detectedMime) || req.file.mimetype !== detectedMime) {
      return res.status(415).json({ success: false, message: 'The uploaded file is not a valid PDF, JPEG, PNG, or WebP file.' });
    }

    const id = crypto.randomUUID();
    const fileName = safeFileName(req.file.originalname) || `print-${id}`;
    const now = new Date();
    const storagePath = `jobs/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${id}/${fileName}`;

    await uploadPrintFile({
      path: storagePath,
      buffer: req.file.buffer,
      contentType: detectedMime,
    });

    await query(
      `INSERT INTO upload_assets(id,storage_path,file_name,mime_type,file_size,expires_at)
       VALUES($1,$2,$3,$4,$5,now()+interval '30 minutes')`,
      [id, storagePath, req.file.originalname, detectedMime, req.file.size],
    );

    res.status(201).json({
      success: true,
      data: {
        uploadId: id,
        storagePath,
        fileName: req.file.originalname,
        mimeType: detectedMime,
        fileSize: req.file.size,
        expiresInSeconds: 1800,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
