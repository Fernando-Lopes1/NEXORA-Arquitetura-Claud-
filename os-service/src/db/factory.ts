import { IDatabaseAdapter } from './adapter.interface';
import { PostgresAdapter } from './postgres.adapter';
import { SqliteAdapter } from './sqlite.adapter';
import { config } from '../config/env';

let dbInstance: IDatabaseAdapter | null = null;

export async function getDatabase(): Promise<IDatabaseAdapter> {
  if (dbInstance) {
    return dbInstance;
  }

  if (config.databaseUrl && config.databaseUrl.trim().length > 0) {
    try {
      console.log('🔌 Tentando conexão com Cloud PostgreSQL (os-service)...');
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
      console.warn('🔄 Ativando fallback autônomo para SQLite local (data/os.sqlite)...');
    }
  } else {
    console.log('ℹ️ Nenhuma DATABASE_URL configurada. Inicializando com SQLite local (data/os.sqlite)...');
  }

  const sqlite = new SqliteAdapter('os.sqlite');
  await sqlite.connect();
  await sqlite.initSchema();
  console.log('✅ SQLite local inicializado com sucesso: data/os.sqlite');
  dbInstance = sqlite;
  return dbInstance;
}

export function resetDatabaseInstance(): void {
  dbInstance = null;
}
