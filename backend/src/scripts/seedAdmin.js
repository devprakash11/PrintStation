import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('ADMIN_PASSWORD must contain at least 8 characters.');
  process.exit(1);
}

async function seedAdmin() {
  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (existingUser) {
      const { error } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          role: 'admin',
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id);

      if (error) throw error;

      console.log(`Admin password updated for ${email}`);
      return;
    }

    const { error } = await supabase
      .from('users')
      .insert({
        name: 'PrintStation Admin',
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: 'admin',
        status: 'active',
      });

    if (error) throw error;

    console.log(`Admin account created for ${email}`);
  } catch (error) {
    console.error('Admin seed failed:', error.message);
    process.exit(1);
  }
}

seedAdmin();