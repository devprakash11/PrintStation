import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.js';
import { uploadPrintFile } from '../storage/supabaseStorage.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
});

function safeFileName(name) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function validateMimeType(file) {
  const allowed = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);
  return allowed.has(file.mimetype);
}

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required.' });
    if (!validateMimeType(req.file)) {
      return res.status(415).json({ success: false, message: 'Only PDF, JPEG, PNG, and WebP files are supported.' });
    }

    const id = crypto.randomUUID();
    const fileName = safeFileName(req.file.originalname) || `print-${id}`;
    const storagePath = `jobs/${new Date().getUTCFullYear()}/${String(new Date().getUTCMonth() + 1).padStart(2, '0')}/${id}/${fileName}`;

    await uploadPrintFile({
      path: storagePath,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    res.status(201).json({
      success: true,
      data: {
        storagePath,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
