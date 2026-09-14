import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { query } from './db/pool.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import agentRoutes from './routes/agents.routes.js';
import agentFilesRoutes from './routes/agentFiles.routes.js';
import printerRoutes from './routes/printers.routes.js';
import qrRoutes from './routes/qr.routes.js';
import printJobRoutes from './routes/printJobs.routes.js';
import uploadRoutes from './routes/uploads.routes.js';
import reportsRoutes from './routes/reports.routes.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const origins = env.clientOrigin.split(',').map(v => v.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => !origin || origins.includes(origin) ? cb(null, true) : cb(new Error('CORS origin denied')),
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const printLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const pairingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/agents/files', agentFilesRoutes);
app.use('/api/v1/agents/pair', pairingLimiter);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/printers', printerRoutes);
app.use('/api/v1/qr-codes', qrRoutes);
app.use('/api/v1/print-jobs/public', printLimiter);
app.use('/api/v1/print-jobs', printJobRoutes);
app.use('/api/v1/uploads', uploadLimiter, uploadRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/users', userRoutes);

app.get('/api/v1/health', async (req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ success: true, status: 'ok', service: 'printstation-api', timestamp: new Date().toISOString() });
  } catch (e) { next(e); }
});

app.get('/api/v1', (_, res) => res.json({ success: true, name: 'PrintStation API', version: '2.0.0' }));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ZodError') return res.status(400).json({ success: false, message: 'Invalid request.', issues: err.issues });
  if (err.code === '23505') return res.status(409).json({ success: false, message: 'A record with these values already exists.' });
  if (err.code === '23503') return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'File is too large.' });
  res.status(err.status || 500).json({ success: false, message: env.nodeEnv === 'production' ? 'Internal server error.' : err.message });
});

export default app;
