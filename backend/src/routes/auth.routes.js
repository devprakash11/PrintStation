import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, signUser } from '../middleware/auth.js';

const router = Router();
const credentials = z.object({ email: z.string().trim().email(), password: z.string().min(8).max(128) });
const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

router.post('/login', async (req, res, next) => {
  try {
    const p = credentials.parse(req.body);
    const { rows } = await query('SELECT id,name,email,password_hash,role,status FROM users WHERE lower(email)=lower($1)', [p.email]);
    const user = rows[0];
    if (!user || user.status !== 'active' || !(await bcrypt.compare(p.password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    await query('UPDATE users SET last_login_at=now(),updated_at=now() WHERE id=$1', [user.id]);
    const { password_hash, ...safe } = user;
    res.json({ success: true, data: { token: signUser(safe), user: safe } });
  } catch (error) { next(error); }
});

router.post('/signup', async (req, res, next) => {
  try {
    const p = signupSchema.parse(req.body);
    const countResult = await query('SELECT COUNT(*)::int AS count FROM users');
    if (countResult.rows[0].count > 0) {
      return res.status(403).json({
        success: false,
        message: 'Public signup is disabled. An administrator must create your account.',
      });
    }

    const hash = await bcrypt.hash(p.password, 12);
    const { rows } = await query(`
      INSERT INTO users(name,email,password_hash,role,status)
      VALUES($1,lower($2),$3,'admin','active')
      RETURNING id,name,email,role,status,created_at
    `, [p.name, p.email, hash]);
    const user = rows[0];
    res.status(201).json({
      success: true,
      data: { token: signUser(user), user },
      message: 'Administrator account created successfully.',
    });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: req.user }));

export default router;
