import { Pool, PoolConfig } from 'pg';
import { IDatabaseAdapter, QueryResult } from './adapter.interface';
import { TECNICOS_POSTGRES_SCHEMA, SEED_TECNICOS } from './schema';

export class PostgresAdapter implements IDatabaseAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const config: PoolConfig = {
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 2500, // Fast failover (2.5s)
      idleTimeoutMillis: 10000,
      max: 10
    };
    this.pool = new Pool(config);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const res = await this.pool.query(sql, params);
    return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async initSchema(): Promise<void> {
    await this.pool.query(TECNICOS_POSTGRES_SCHEMA);

    const checkRes = await this.pool.query('SELECT COUNT(*) as total FROM tecnicos');
    const total = Number(checkRes.rows[0]?.total || 0);

    if (total === 0) {
      console.log('🌱 Populando seed inicial de Técnicos no PostgreSQL...');
      for (const item of SEED_TECNICOS) {
        await this.pool.query(
          `INSERT INTO tecnicos (nome, especialidade, telefone, email, regiao, status, criado_em, atualizado_em)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            item.nome,
            item.especialidade,
            item.telefone,
            item.email,
            item.regiao,
            item.status,
            item.criado_em,
            item.atualizado_em
          ]
        );
      }
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const res = await this.pool.query('SELECT 1 as ok');
      return res.rowCount !== null && res.rowCount > 0;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  getProviderName(): 'PostgreSQL' {
    return 'PostgreSQL';
  }
}
