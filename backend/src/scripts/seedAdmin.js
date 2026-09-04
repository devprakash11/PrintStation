import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query, pool } from '../db/pool.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'PrintStation Admin';

if (!email || !password) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  process.exit(1);
}

if (password.length < 8 || password.length > 72) {
  console.error('ADMIN_PASSWORD must contain between 8 and 72 characters.');
  process.exit(1);
}

async function seedAdmin() {
  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',
      [email],
    );

    if (existing.rowCount) {
      await query(
        `UPDATE users
         SET password_hash=$1,
             role='admin',
             status='active',
             updated_at=NOW()
         WHERE id=$2`,
        [passwordHash, existing.rows[0].id],
      );

      console.log(`Admin account updated for ${email}`);
      return;
    }

    await query(
      `INSERT INTO users (name,email,password_hash,role,status)
       VALUES ($1,$2,$3,'admin','active')`,
      [name, email, passwordHash],
    );

    console.log(`Admin account created for ${email}`);
  } catch (error) {
    console.error('Admin seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedAdmin();
