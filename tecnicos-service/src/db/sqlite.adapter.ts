import fs from 'fs';
import path from 'path';
import { IDatabaseAdapter, QueryResult } from './adapter.interface';
import { TECNICOS_SQLITE_SCHEMA, SEED_TECNICOS } from './schema';

export class SqliteAdapter implements IDatabaseAdapter {
  private db: any;
  private dbPath: string;

  constructor(filename: string = 'tecnicos.sqlite') {
    const dataDir = process.env.DATA_DIR && process.env.DATA_DIR.trim().length > 0
      ? path.resolve(process.env.DATA_DIR)
      : path.resolve(process.cwd(), 'data');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, filename);
  }

  async connect(): Promise<void> {
    try {
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(this.dbPath);
    } catch (err: any) {
      throw new Error(`Falha ao inicializar SQLite nativo: ${err.message}`);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    const trimmed = sqliteSql.trim();
    const isSelect = trimmed.toUpperCase().startsWith('SELECT');
    const isReturning = trimmed.toUpperCase().includes('RETURNING');

    try {
      const stmt = this.db.prepare(sqliteSql);
      if (isSelect || isReturning) {
        const rows = stmt.all(...params) as T[];
        return { rows: rows || [], rowCount: rows?.length || 0 };
      } else {
        const result = stmt.run(...params);
        return { rows: [], rowCount: Number(result.changes || 0) };
      }
    } catch (error: any) {
      throw new Error(`Erro na execução SQLite [${sqliteSql}]: ${error.message}`);
    }
  }

  async exec(sql: string): Promise<void> {
    try {
      this.db.exec(sql);
    } catch (error: any) {
      throw new Error(`Erro ao executar script SQLite: ${error.message}`);
    }
  }

  async initSchema(): Promise<void> {
    this.db.exec(TECNICOS_SQLITE_SCHEMA);

    const checkStmt = this.db.prepare('SELECT COUNT(*) as total FROM tecnicos');
    const res = checkStmt.get() as { total: number };

    if (res && Number(res.total) === 0) {
      console.log('🌱 Populando seed inicial de Técnicos no SQLite...');
      const insertStmt = this.db.prepare(`
        INSERT INTO tecnicos (nome, especialidade, telefone, email, regiao, status, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of SEED_TECNICOS) {
        insertStmt.run(
          item.nome,
          item.especialidade,
          item.telefone,
          item.email,
          item.regiao,
          item.status,
          item.criado_em,
          item.atualizado_em
        );
      }
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      if (!this.db) return false;
      const stmt = this.db.prepare('SELECT 1 as ok');
      const row = stmt.get() as { ok: number };
      return row && row.ok === 1;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getProviderName(): 'SQLite' {
    return 'SQLite';
  }
}
