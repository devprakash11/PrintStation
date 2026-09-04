import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, signAccessToken } from '../middleware/auth.js';

const router = Router();
const credentials = z.object({ body: z.object({ email: z.string().email().transform((v) => v.toLowerCase().trim()), password: z.string().min(8).max(72), name: z.string().trim().min(2).max(100).optional() }), params: z.object({}), query: z.object({}) });

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = credentials.parse({ body: req.body, params: {}, query: {} }).body;
    const exists = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rowCount) return res.status(409).json({ success: false, message: 'Email is already registered.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(`INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,'admin') RETURNING id,name,email,role,created_at`, [name || 'Admin', email, passwordHash]);
    const user = result.rows[0];
    res.status(201).json({ success: true, data: { user, token: signAccessToken(user) } });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = credentials.parse({ body: req.body, params: {}, query: {} }).body;
    const result = await query('SELECT id,name,email,password_hash,role,status FROM users WHERE email=$1 LIMIT 1', [email]);
    const user = result.rows[0];
    if (!user || user.status !== 'active' || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    await query('UPDATE users SET last_login_at=NOW() WHERE id=$1', [user.id]);
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ success: true, data: { user: safeUser, token: signAccessToken(safeUser) } });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try { const result = await query('SELECT id,name,email,role,status,created_at,last_login_at FROM users WHERE id=$1', [req.user.sub]); res.json({ success: true, data: result.rows[0] || null }); }
  catch (e) { next(e); }
});

router.post('/logout', requireAuth, (req, res) => res.json({ success: true, message: 'Logged out. Remove the access token from the client.' }));
export default router;
