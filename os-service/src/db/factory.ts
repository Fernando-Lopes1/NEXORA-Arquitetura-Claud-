import { IDatabaseAdapter } from './adapter.interface';
import { AzureSqlAdapter } from './azuresql.adapter';
import { PostgresAdapter } from './postgres.adapter';
import { SqliteAdapter } from './sqlite.adapter';
import { config } from '../config/env';

let dbInstance: IDatabaseAdapter | null = null;

export async function getDatabase(): Promise<IDatabaseAdapter> {
  if (dbInstance) {
    return dbInstance;
  }

  const isSqlServerUrl =
    config.databaseUrl.startsWith('mssql://') ||
    config.databaseUrl.startsWith('azuresql://') ||
    config.databaseUrl.toLowerCase().includes('database.windows.net') ||
    config.databaseUrl.toLowerCase().startsWith('server=');

  const azureSqlConn = config.azureSqlConnectionString || (isSqlServerUrl ? config.databaseUrl : '');

  if (azureSqlConn && azureSqlConn.trim().length > 0) {
    try {
      console.log('🔷 Tentando conexão com Azure SQL Database Free 1 DTU (os-service)...');
      const azureSql = new AzureSqlAdapter(azureSqlConn.trim());
      await azureSql.connect();
      const isConnected = await azureSql.checkConnection();
      if (isConnected) {
        await azureSql.initSchema();
        console.log('✅ Conectado ao Azure SQL Database com sucesso!');
        dbInstance = azureSql;
        return dbInstance;
      }
      throw new Error('Falha no teste de conexão com Azure SQL Database');
    } catch (err: any) {
      console.warn(`⚠️ Falha na conexão Azure SQL Database (${err.message}).`);
      console.warn('🔄 Ativando fallback autônomo para persistência local...');
    }
  }

  if (config.databaseUrl && config.databaseUrl.trim().length > 0 && !isSqlServerUrl) {
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
  } else if (!azureSqlConn) {
    console.log('ℹ️ Nenhuma AZURE_SQL_CONNECTION_STRING configurada. Inicializando com SQLite local (data/os.sqlite)...');
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
