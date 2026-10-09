import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 8081,
  databaseUrl: (process.env.DATABASE_URL || process.env.OS_DATABASE_URL || '').trim(),
  nodeEnv: process.env.NODE_ENV || 'development'
};
