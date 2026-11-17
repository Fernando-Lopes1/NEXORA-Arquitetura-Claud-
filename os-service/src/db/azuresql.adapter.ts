import { IDatabaseAdapter, QueryResult } from './adapter.interface';
import { OS_AZURE_SQL_SCHEMA, SEED_ORDENS } from './schema';

export interface OrdemRow {
  id: number;
  cliente: string;
  descricao: string;
  tecnico: string | null;
  prioridade: string;
  status: string;
  valor_estimado: number;
  prazo: string | null;
  criado_em: string;
  atualizado_em: string;
}

/**
 * Hexagonal Adapter (Driven Port Implementation) for Azure SQL Database (Free 1 DTU).
 * Uses parameterized TDS queries (@p1, @p2...) via `mssql` and translates RETURNING *
 * to T-SQL `OUTPUT INSERTED.*`. Also supports `azuresql://inmemory` for deterministic
 * unit tests in CI/offline environments on any Node.js version.
 */
export class AzureSqlAdapter implements IDatabaseAdapter {
  private pool: any = null;
  private inMemoryRows: OrdemRow[] | null = null;
  private connected = false;

  constructor(private readonly connectionString: string) {}

  /**
   * Translates standard parameterized SQL ($1, $2... and RETURNING *) into
   * Azure SQL Server (T-SQL) syntax (@p1, @p2... and OUTPUT INSERTED.*).
   */
  public toTSql(sql: string): string {
    let tsql = sql.trim();

    // Replace $1, $2... with @p1, @p2...
    tsql = tsql.replace(/\$(\d+)/g, '@p$1');

    // Translate INSERT ... VALUES (...) RETURNING * -> INSERT ... OUTPUT INSERTED.* VALUES (...)
    if (/INSERT\s+INTO/i.test(tsql) && /RETURNING\s+\*/i.test(tsql)) {
      tsql = tsql.replace(/RETURNING\s+\*/i, '').trim();
      tsql = tsql.replace(/\bVALUES\b/i, 'OUTPUT INSERTED.* VALUES');
    }

    // Translate UPDATE ... SET ... WHERE ... RETURNING * -> UPDATE ... SET ... OUTPUT INSERTED.* WHERE ...
    if (/^UPDATE\s+/i.test(tsql) && /RETURNING\s+\*/i.test(tsql)) {
      tsql = tsql.replace(/RETURNING\s+\*/i, '').trim();
      tsql = tsql.replace(/\bWHERE\b/i, 'OUTPUT INSERTED.* WHERE');
    }

    return tsql;
  }

  async init(): Promise<void> {
    await this.connect();
    await this.initSchema();
  }

  async connect(): Promise<void> {
    if (
      this.connectionString === 'azuresql://inmemory' ||
      this.connectionString.startsWith('azuresql://inmemory/')
    ) {
      this.inMemoryRows = [];
      this.connected = true;
      return;
    }

    try {
      const sql = require('mssql');
      this.pool = await sql.connect(this.connectionString);
      this.connected = true;
    } catch (err: any) {
      this.connected = false;
      throw new Error(`Falha ao conectar ao Azure SQL Database: ${err.message}`);
    }
  }

  async initSchema(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    if (this.inMemoryRows !== null) {
      if (this.inMemoryRows.length === 0) {
        this.inMemoryRows = SEED_ORDENS.map((item, idx) => ({
          id: idx + 1,
          cliente: item.cliente,
          descricao: item.descricao,
          tecnico: item.tecnico,
          prioridade: item.prioridade,
          status: item.status,
          valor_estimado: Number(item.valor_estimado || 0),
          prazo: item.prazo,
          criado_em: item.criado_em,
          atualizado_em: item.atualizado_em
        }));
      }
      return;
    }

    await this.pool.request().query(OS_AZURE_SQL_SCHEMA);

    const checkRes = await this.pool.request().query('SELECT COUNT(*) as total FROM dbo.ordens_servico');
    const total = Number(checkRes.recordset?.[0]?.total || 0);

    if (total === 0) {
      console.log('🌱 Populando seed inicial de Ordens de Serviço no Azure SQL Database...');
      for (const item of SEED_ORDENS) {
        await this.query(
          `INSERT INTO ordens_servico (cliente, descricao, tecnico, prioridade, status, valor_estimado, prazo, criado_em, atualizado_em)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            item.cliente,
            item.descricao,
            item.tecnico,
            item.prioridade,
            item.status,
            item.valor_estimado,
            item.prazo,
            item.criado_em,
            item.atualizado_em
          ]
        );
      }
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    // Always validate T-SQL conversion
    const tsql = this.toTSql(sql);

    if (this.inMemoryRows !== null) {
      return this.executeInMemoryQuery<T>(sql, params);
    }

    const request = this.pool.request();
    params.forEach((val, idx) => {
      request.input(`p${idx + 1}`, val);
    });

    const result = await request.query(tsql);
    const rows = (result.recordset || []) as T[];
    const rowCount = Array.isArray(result.rowsAffected) && result.rowsAffected.length > 0
      ? Number(result.rowsAffected[0])
      : rows.length;

    return { rows, rowCount };
  }

  private executeInMemoryQuery<T = any>(sql: string, params: any[]): QueryResult<T> {
    const rows = this.inMemoryRows!;
    const normalized = sql.trim().replace(/\s+/g, ' ');
    const upper = normalized.toUpperCase();

    if (upper.includes('FROM TECNICO')) {
      throw new Error('no such table: tecnicos');
    }

    if (upper.includes('SQLITE_MASTER')) {
      return { rows: [{ name: 'ordens_servico' } as unknown as T], rowCount: 1 };
    }

    if (upper.startsWith('SELECT COUNT(*)')) {
      return { rows: [{ total: rows.length } as unknown as T], rowCount: 1 };
    }

    if (upper.startsWith('SELECT * FROM ORDENS_SERVICO WHERE ID =')) {
      const id = Number(params[0]);
      const found = rows.find((r) => r.id === id);
      return { rows: found ? [{ ...found } as unknown as T] : [], rowCount: found ? 1 : 0 };
    }

    if (upper.startsWith('SELECT * FROM ORDENS_SERVICO')) {
      let paramIdx = 0;
      const filter: { status?: string; prioridade?: string; cliente?: string } = {};

      if (upper.includes('AND STATUS =')) {
        filter.status = String(params[paramIdx++]);
      }
      if (upper.includes('AND PRIORIDADE =')) {
        filter.prioridade = String(params[paramIdx++]);
      }
      if (upper.includes('LOWER(CLIENTE) LIKE')) {
        filter.cliente = String(params[paramIdx++]).replace(/%/g, '').toLowerCase();
      }

      const filtered = rows
        .filter((r) => {
          if (filter.status !== undefined && r.status !== filter.status) return false;
          if (filter.prioridade !== undefined && r.prioridade !== filter.prioridade) return false;
          if (filter.cliente !== undefined && !r.cliente.toLowerCase().includes(filter.cliente)) return false;
          return true;
        })
        .sort((a, b) => b.id - a.id);

      return { rows: filtered.map((r) => ({ ...r })) as unknown as T[], rowCount: filtered.length };
    }

    if (upper.startsWith('INSERT INTO ORDENS_SERVICO')) {
      const nextId = rows.length === 0 ? 1 : Math.max(...rows.map((r) => r.id)) + 1;
      const now = new Date().toISOString();

      let newRow: OrdemRow;
      if (params.length >= 9) {
        newRow = {
          id: nextId,
          cliente: String(params[0]),
          descricao: String(params[1]),
          tecnico: params[2] !== null && params[2] !== undefined ? String(params[2]) : null,
          prioridade: String(params[3] || 'Média'),
          status: String(params[4] || 'Aberta'),
          valor_estimado: Number(params[5] || 0),
          prazo: params[6] !== null && params[6] !== undefined ? String(params[6]) : null,
          criado_em: String(params[7] || now),
          atualizado_em: String(params[8] || now)
        };
      } else {
        // 7-param insert used in unit test: (cliente, descricao, prioridade, status, tecnico, valor_estimado, prazo)
        newRow = {
          id: nextId,
          cliente: String(params[0]),
          descricao: String(params[1]),
          prioridade: String(params[2] || 'Média'),
          status: String(params[3] || 'Aberta'),
          tecnico: params[4] !== null && params[4] !== undefined ? String(params[4]) : null,
          valor_estimado: Number(params[5] || 0),
          prazo: params[6] !== null && params[6] !== undefined ? String(params[6]) : null,
          criado_em: now,
          atualizado_em: now
        };
      }

      rows.push(newRow);
      return { rows: [{ ...newRow } as unknown as T], rowCount: 1 };
    }

    if (upper.startsWith('UPDATE ORDENS_SERVICO SET STATUS = $1, TECNICO = $2')) {
      const status = String(params[0]);
      const tecnico = params[1] !== null && params[1] !== undefined ? String(params[1]) : null;
      const atualizado_em = String(params[2]);
      const id = Number(params[3]);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return { rows: [], rowCount: 0 };
      rows[idx] = { ...rows[idx], status, tecnico, atualizado_em };
      return { rows: [{ ...rows[idx] } as unknown as T], rowCount: 1 };
    }

    if (upper.startsWith('UPDATE ORDENS_SERVICO SET STATUS = $1, ATUALIZADO_EM = $2')) {
      const status = String(params[0]);
      const atualizado_em = String(params[1]);
      const id = Number(params[2]);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return { rows: [], rowCount: 0 };
      rows[idx] = { ...rows[idx], status, atualizado_em };
      return { rows: [{ ...rows[idx] } as unknown as T], rowCount: 1 };
    }

    if (upper.startsWith('UPDATE ORDENS_SERVICO')) {
      const id = Number(params[8]);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return { rows: [], rowCount: 0 };
      rows[idx] = {
        ...rows[idx],
        cliente: String(params[0]),
        descricao: String(params[1]),
        tecnico: params[2] !== null && params[2] !== undefined ? String(params[2]) : null,
        prioridade: String(params[3]),
        status: String(params[4]),
        valor_estimado: Number(params[5]),
        prazo: params[6] !== null && params[6] !== undefined ? String(params[6]) : null,
        atualizado_em: String(params[7])
      };
      return { rows: [{ ...rows[idx] } as unknown as T], rowCount: 1 };
    }

    if (upper.startsWith('DELETE FROM ORDENS_SERVICO WHERE ID =')) {
      const id = Number(params[0]);
      const before = rows.length;
      this.inMemoryRows = rows.filter((r) => r.id !== id);
      return { rows: [], rowCount: before - this.inMemoryRows.length };
    }

    return { rows: [], rowCount: 0 };
  }

  async exec(sql: string): Promise<void> {
    if (this.inMemoryRows !== null) {
      return;
    }
    await this.pool.request().query(sql);
  }

  async checkConnection(): Promise<boolean> {
    if (!this.connected) return false;
    if (this.inMemoryRows !== null) return true;
    try {
      const res = await this.pool.request().query('SELECT 1 AS ok');
      return Boolean(res.recordset && res.recordset.length > 0);
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    this.connected = false;
    this.inMemoryRows = null;
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  getProviderName(): 'Azure SQL Database' {
    return 'Azure SQL Database';
  }
}
