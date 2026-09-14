import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function uploadPrintFile({ path, buffer, contentType }) {
  const { error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .upload(path, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    const err = new Error(`Supabase Storage upload failed: ${error.message}`);
    err.status = 502;
    throw err;
  }

  return path;
}

export async function downloadPrintFile(path) {
  const { data, error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .download(path);

  if (error || !data) {
    const err = new Error(`Supabase Storage download failed: ${error?.message || 'File not found.'}`);
    err.status = 404;
    throw err;
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function createPrintFileSignedUrl(path, expiresInSeconds = 300) {
  const { data, error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    const err = new Error(`Supabase Storage signed URL failed: ${error?.message || 'Unable to create URL.'}`);
    err.status = 502;
    throw err;
  }

  return data.signedUrl;
}

export async function deletePrintFile(path) {
  const { error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .remove([path]);

  if (error) {
    const err = new Error(`Supabase Storage delete failed: ${error.message}`);
    err.status = 502;
    throw err;
  }
}
