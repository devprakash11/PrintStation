import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
});

function safeFileName(name) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required.' });

    const id = crypto.randomUUID();
    const fileName = safeFileName(req.file.originalname);
    const storedName = `${id}-${fileName}`;
    const absolutePath = path.resolve(env.uploadDir, storedName);

    await fs.mkdir(path.resolve(env.uploadDir), { recursive: true });
    await fs.writeFile(absolutePath, req.file.buffer, { flag: 'wx' });

    res.status(201).json({
      success: true,
      data: {
        storagePath: storedName,
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
