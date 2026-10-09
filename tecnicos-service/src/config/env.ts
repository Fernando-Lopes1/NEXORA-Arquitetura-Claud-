import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 8082,
  databaseUrl: (process.env.TECNICOS_DATABASE_URL || process.env.DATABASE_URL || '').trim(),
  dataDir: (process.env.DATA_DIR || '').trim(),
  nodeEnv: process.env.NODE_ENV || 'development'
};
