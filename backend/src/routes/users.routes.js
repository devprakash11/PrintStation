import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const roles = ['admin', 'staff', 'operator'];
const statuses = ['active', 'disabled'];
const userCreate = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(roles).default('operator'),
});
const userUpdate = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(255).optional(),
  role: z.enum(roles).optional(),
  status: z.enum(statuses).optional(),
  password: z.string().min(8).max(128).optional(),
});

router.use(requireAuth, requireRoles('admin'));

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id,name,email,role,status,last_login_at,created_at,updated_at
      FROM users ORDER BY created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const p = userCreate.parse(req.body);
    const hash = await bcrypt.hash(p.password, 12);
    const { rows } = await query(`
      INSERT INTO users(name,email,password_hash,role,status)
      VALUES($1,lower($2),$3,$4,'active')
      RETURNING id,name,email,role,status,last_login_at,created_at,updated_at
    `, [p.name, p.email, hash, p.role]);
    res.status(201).json({ success: true, data: rows[0], message: 'User created successfully.' });
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const p = userUpdate.parse(req.body);
    if (p.status === 'disabled' && req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot disable your own account.' });
    }
    if (p.role && req.params.id === req.user.id && p.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot remove your own administrator role.' });
    }

    const passwordHash = p.password ? await bcrypt.hash(p.password, 12) : null;
    const { rows } = await query(`
      UPDATE users
      SET name=COALESCE($1,name), email=COALESCE(lower($2),email), role=COALESCE($3,role),
          status=COALESCE($4,status), password_hash=COALESCE($5,password_hash), updated_at=now()
      WHERE id=$6
      RETURNING id,name,email,role,status,last_login_at,created_at,updated_at
    `, [p.name ?? null, p.email ?? null, p.role ?? null, p.status ?? null, passwordHash, req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: rows[0], message: 'User updated successfully.' });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    const { rows } = await query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) { next(error); }
});

export default router;
