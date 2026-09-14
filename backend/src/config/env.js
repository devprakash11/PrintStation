import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET', 'AGENT_SECRET_PEPPER'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  agentSecretPepper: process.env.AGENT_SECRET_PEPPER,
  qrBaseUrl: process.env.QR_BASE_URL || 'http://localhost:5173/print',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 20),
};
