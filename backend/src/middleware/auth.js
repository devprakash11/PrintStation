import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';

export function signUser(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, { expiresIn: '7d' });
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const payload = jwt.verify(header.slice(7), env.jwtSecret);
    const result = await query('SELECT id, name, email, role, status FROM users WHERE id = $1', [payload.sub]);
    if (!result.rows[0] || result.rows[0].status !== 'active') return res.status(401).json({ success: false, message: 'Account is unavailable.' });
    req.user = result.rows[0];
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ success: false, message: 'Insufficient permissions.' });
}
