import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { query } from './db/pool.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import printersRoutes from './routes/printers.routes.js';
import qrRoutes from './routes/qr.routes.js';
import printJobsRoutes from './routes/printJobs.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import uploadsRoutes from './routes/uploads.routes.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.clientOrigin.split(',').map((v) => v.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/printers', printersRoutes);
app.use('/api/v1/qr-codes', qrRoutes);
app.use('/api/v1/print-jobs', printJobsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/uploads', uploadsRoutes);

app.get('/api/v1/health', async (req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ success: true, status: 'ok', service: 'printstation-api', timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use(errorHandler);
export default app;
