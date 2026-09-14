import bcrypt from 'bcryptjs';
import { query, pool } from '../db/pool.js';
const email=process.env.ADMIN_EMAIL||'admin@example.com';
const password=process.env.ADMIN_PASSWORD;
if(!password)throw new Error('Set ADMIN_PASSWORD before seeding an admin.');
const hash=await bcrypt.hash(password,12);
await query(`INSERT INTO users(name,email,password_hash,role,status) VALUES($1,$2,$3,'admin','active') ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,status='active',role='admin'`,['PrintStation Admin',email,hash]);
console.log(`Admin ready: ${email}`); await pool.end();
