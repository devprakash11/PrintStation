import 'dotenv/config';

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'AGENT_SECRET_PEPPER',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

if (isProduction) required.push('CLIENT_ORIGIN', 'PUBLIC_BASE_URL', 'QR_BASE_URL');

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const port = Number(process.env.PORT || 5000);
const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 20);

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
if (!Number.isFinite(maxFileSizeMb) || maxFileSizeMb <= 0 || maxFileSizeMb > 100) {
  throw new Error('MAX_FILE_SIZE_MB must be greater than 0 and no more than 100.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port,
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(v => v.trim()).filter(Boolean).join(','),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  agentSecretPepper: process.env.AGENT_SECRET_PEPPER,
  qrBaseUrl: (process.env.QR_BASE_URL || 'http://localhost:5173/print').replace(/\/$/, ''),
  maxFileSizeMb,
  supabaseUrl: process.env.SUPABASE_URL.replace(/\/$/, ''),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'print-files',
};
