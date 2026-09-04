import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
export const storage = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, { auth: { autoRefreshToken:false, persistSession:false } });

export async function uploadFile(file, folder='documents') {
  const safeName=file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`${folder}/${Date.now()}-${safeName}`;
  const { error }=await storage.storage.from(env.storageBucket).upload(path,file.buffer,{contentType:file.mimetype,upsert:false});
  if(error) throw error;
  return path;
}
export async function createSignedUrl(path,expiresIn=3600){const {data,error}=await storage.storage.from(env.storageBucket).createSignedUrl(path,expiresIn);if(error)throw error;return data.signedUrl;}
export async function removeFile(path){const {error}=await storage.storage.from(env.storageBucket).remove([path]);if(error)throw error;}
