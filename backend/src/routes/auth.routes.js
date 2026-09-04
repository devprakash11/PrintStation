import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, signAccessToken } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const router = Router();

const credentials = z.object({
  body: z.object({
    email: z.string().email().transform((value) => value.toLowerCase().trim()),
    password: z.string().min(8).max(72),
    name: z.string().trim().min(2).max(100).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

const emailOnly = z.object({
  body: z.object({
    email: z.string().email().transform((value) => value.toLowerCase().trim()),
  }),
  params: z.object({}),
  query: z.object({}),
});

const resetPayload = z.object({
  body: z.object({
    token: z.string().min(32).max(256),
    password: z.string().min(8).max(72),
  }),
  params: z.object({}),
  query: z.object({}),
});

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = credentials.parse({
      body: req.body,
      params: {},
      query: {},
    }).body;

    const countResult = await query('SELECT COUNT(*)::int AS count FROM users');
    const isFirstUser = Number(countResult.rows[0]?.count || 0) === 0;
    const role = isFirstUser ? 'admin' : 'staff';

    const exists = await query(
      'SELECT id FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',
      [email],
    );

    if (exists.rowCount) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in instead.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (name,email,password_hash,role,status)
       VALUES ($1,$2,$3,$4,'active')
       RETURNING id,name,email,role,status,created_at`,
      [name || (isFirstUser ? 'PrintStation Admin' : 'PrintStation Staff'), email, passwordHash, role],
    );

    const user = result.rows[0];
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return res.status(201).json({
      success: true,
      message: isFirstUser
        ? 'Administrator account created successfully.'
        : 'Account created successfully. Your account has staff access.',
      data: {
        user: safeUser,
        token: signAccessToken(safeUser),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = credentials.parse({
      body: req.body,
      params: {},
      query: {},
    }).body;

    const result = await query(
      `SELECT id,name,email,password_hash,role,status
       FROM users
       WHERE LOWER(email)=LOWER($1)
       LIMIT 1`,
      [email],
    );

    const user = result.rows[0];

    if (
      !user ||
      user.status !== 'active' ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    await query('UPDATE users SET last_login_at=NOW(), updated_at=NOW() WHERE id=$1', [user.id]);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: safeUser,
        token: signAccessToken(safeUser),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  const genericResponse = {
    success: true,
    message: 'If an active admin account exists for that email, a password reset link has been sent.',
  };

  try {
    const { email } = emailOnly.parse({
      body: req.body,
      params: {},
      query: {},
    }).body;

    const result = await query(
      `SELECT id,name,email,status
       FROM users
       WHERE LOWER(email)=LOWER($1)
       LIMIT 1`,
      [email],
    );

    const user = result.rows[0];

    if (!user || user.status !== 'active') return res.json(genericResponse);

    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await query(
      'DELETE FROM password_reset_tokens WHERE user_id=$1 OR expires_at < NOW()',
      [user.id],
    );

    await query(
      `INSERT INTO password_reset_tokens (user_id,token_hash,expires_at)
       VALUES ($1,$2,$3)`,
      [user.id, tokenHash, expiresAt],
    );

    const frontendUrl = (
      process.env.FRONTEND_URL ||
      process.env.CLIENT_ORIGIN ||
      'http://localhost:5173'
    ).replace(/\/$/, '');

    const resetUrl = `${frontendUrl}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    return res.json(genericResponse);
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = resetPayload.parse({
      body: req.body,
      params: {},
      query: {},
    }).body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await query(
      `SELECT id,user_id
       FROM password_reset_tokens
       WHERE token_hash=$1
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );

    const resetToken = result.rows[0];

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has expired.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await query(
      'UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2',
      [passwordHash, resetToken.user_id],
    );

    await query(
      'UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1',
      [resetToken.id],
    );

    await query(
      'DELETE FROM password_reset_tokens WHERE user_id=$1 AND id<>$2',
      [resetToken.user_id, resetToken.id],
    );

    return res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id,name,email,role,status,created_at,last_login_at
       FROM users
       WHERE id=$1`,
      [req.user.sub],
    );

    if (!result.rows[0] || result.rows[0].status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your session is no longer valid.',
      });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out. Remove the access token from the client.',
  });
});

export default router;
