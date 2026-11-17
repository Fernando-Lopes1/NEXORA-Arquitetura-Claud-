import { IDatabaseAdapter } from './adapter.interface';
import { MongoAdapter } from './mongo.adapter';
import { PostgresAdapter } from './postgres.adapter';
import { SqliteAdapter } from './sqlite.adapter';
import { config } from '../config/env';

let dbInstance: IDatabaseAdapter | null = null;

export async function getDatabase(): Promise<IDatabaseAdapter> {
  if (dbInstance) {
    return dbInstance;
  }

  const mongoUri = config.mongodbUri || (config.databaseUrl.startsWith('mongodb') ? config.databaseUrl : '');

  if (mongoUri && mongoUri.trim().length > 0) {
    try {
      console.log('🍃 Tentando conexão com MongoDB Atlas Free Tier (tecnicos-service)...');
      const mongo = new MongoAdapter(mongoUri.trim(), config.mongodbDbName);
      await mongo.connect();
      const isConnected = await mongo.checkConnection();
      if (isConnected) {
        await mongo.initSchema();
        console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
        dbInstance = mongo;
        return dbInstance;
      }
      throw new Error('Falha no ping de conexão com MongoDB Atlas');
    } catch (err: any) {
      console.warn(`⚠️ Falha na conexão MongoDB Atlas (${err.message}).`);
      console.warn('🔄 Ativando fallback autônomo para persistência local...');
    }
  }

  if (config.databaseUrl && config.databaseUrl.trim().length > 0 && !config.databaseUrl.startsWith('mongodb')) {
    try {
      console.log('🔌 Tentando conexão com Cloud PostgreSQL (tecnicos-service)...');
      const pg = new PostgresAdapter(config.databaseUrl);
      const isConnected = await pg.checkConnection();
      if (isConnected) {
        await pg.initSchema();
        console.log('✅ Conectado ao Cloud PostgreSQL com sucesso!');
        dbInstance = pg;
        return dbInstance;
      }
      throw new Error('Falha no teste de conexão PostgreSQL');
    } catch (err: any) {
      console.warn(`⚠️ Falha na conexão PostgreSQL (${err.message}).`);
      console.warn('🔄 Ativando fallback autônomo para SQLite local (data/tecnicos.sqlite)...');
    }
  } else if (!mongoUri) {
    console.log('ℹ️ Nenhuma MONGODB_URI configurada. Inicializando com SQLite local (data/tecnicos.sqlite)...');
  }

  const sqlite = new SqliteAdapter('tecnicos.sqlite');
  await sqlite.connect();
  await sqlite.initSchema();
  console.log('✅ SQLite local inicializado com sucesso: data/tecnicos.sqlite');
  dbInstance = sqlite;
  return dbInstance;
}

export function resetDatabaseInstance(): void {
  dbInstance = null;
}
