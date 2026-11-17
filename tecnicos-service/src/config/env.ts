import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 8082,
  mongodbUri: (process.env.MONGODB_URI || process.env.MONGO_URL || '').trim(),
  mongodbDbName: (process.env.MONGODB_DB_NAME || 'nexora_tecnicos').trim(),
  databaseUrl: (process.env.TECNICOS_DATABASE_URL || process.env.DATABASE_URL || '').trim(),
  serviceBusConnectionString: (process.env.AZURE_SERVICE_BUS_CONNECTION_STRING || '').trim(),
  serviceBusQueue: (process.env.AZURE_SERVICE_BUS_QUEUE || 'nexora-ordens-eventos').trim(),
  dataDir: (process.env.DATA_DIR || '').trim(),
  nodeEnv: process.env.NODE_ENV || 'development'
};
