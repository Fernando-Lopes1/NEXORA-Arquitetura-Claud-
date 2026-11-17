import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 8081,
  azureSqlConnectionString: (
    process.env.AZURE_SQL_CONNECTION_STRING ||
    process.env.SQLAZURECONNSTR_DefaultConnection ||
    ''
  ).trim(),
  databaseUrl: (process.env.DATABASE_URL || process.env.OS_DATABASE_URL || '').trim(),
  serviceBusConnectionString: (process.env.AZURE_SERVICE_BUS_CONNECTION_STRING || '').trim(),
  serviceBusQueue: (process.env.AZURE_SERVICE_BUS_QUEUE || 'nexora-ordens-eventos').trim(),
  tecnicosServiceUrl: (process.env.TECNICOS_SERVICE_URL || 'http://127.0.0.1:8082').trim(),
  nodeEnv: process.env.NODE_ENV || 'development'
};
