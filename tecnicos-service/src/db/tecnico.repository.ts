import { IDatabaseAdapter } from './adapter.interface';
import { getDatabase } from './factory';
import {
  Tecnico,
  CreateTecnicoDTO,
  UpdateTecnicoDTO,
  TecnicoFilter,
  EspecialidadeTecnico,
  StatusDisponibilidade
} from '../models/Tecnico';

export function formatTecnico(row: any): Tecnico {
  return {
    id: Number(row.id),
    nome: String(row.nome),
    especialidade: row.especialidade as EspecialidadeTecnico,
    telefone: row.telefone ? String(row.telefone) : null,
    email: row.email ? String(row.email) : null,
    regiao: row.regiao ? String(row.regiao) : null,
    status: row.status as StatusDisponibilidade,
    criado_em: typeof row.criado_em === 'object' && row.criado_em instanceof Date
      ? row.criado_em.toISOString()
      : String(row.criado_em),
    atualizado_em: typeof row.atualizado_em === 'object' && row.atualizado_em instanceof Date
      ? row.atualizado_em.toISOString()
      : String(row.atualizado_em)
  };
}

export class TecnicoRepository {
  constructor(private adapterProvider?: () => Promise<IDatabaseAdapter>) {}

  private async getAdapter(): Promise<IDatabaseAdapter> {
    if (this.adapterProvider) {
      return this.adapterProvider();
    }
    return getDatabase();
  }

  async findAll(filter?: TecnicoFilter): Promise<Tecnico[]> {
    const adapter = await this.getAdapter();
    let sql = 'SELECT * FROM tecnicos WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filter?.especialidade && filter.especialidade.trim() !== '') {
      sql += ` AND LOWER(especialidade) = LOWER($${paramIndex++})`;
      params.push(filter.especialidade.trim());
    }
    if (filter?.status && filter.status.trim() !== '') {
      sql += ` AND LOWER(status) = LOWER($${paramIndex++})`;
      params.push(filter.status.trim());
    }
    if (filter?.regiao && filter.regiao.trim() !== '') {
      sql += ` AND LOWER(regiao) LIKE $${paramIndex++}`;
      params.push(`%${filter.regiao.trim().toLowerCase()}%`);
    }

    sql += ' ORDER BY id ASC';
    const result = await adapter.query(sql, params);
    return result.rows.map(formatTecnico);
  }

  async findById(id: number): Promise<Tecnico | null> {
    const adapter = await this.getAdapter();
    const result = await adapter.query('SELECT * FROM tecnicos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return formatTecnico(result.rows[0]);
  }

  async create(data: CreateTecnicoDTO): Promise<Tecnico> {
    const adapter = await this.getAdapter();
    const now = new Date().toISOString();
    const status = data.status || 'Disponível';

    const sql = `
      INSERT INTO tecnicos (nome, especialidade, telefone, email, regiao, status, criado_em, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [
      data.nome.trim(),
      data.especialidade.trim(),
      data.telefone && data.telefone.trim() ? data.telefone.trim() : null,
      data.email && data.email.trim() ? data.email.trim() : null,
      data.regiao && data.regiao.trim() ? data.regiao.trim() : null,
      status,
      now,
      now
    ];

    const result = await adapter.query(sql, params);
    return formatTecnico(result.rows[0]);
  }

  async update(id: number, data: UpdateTecnicoDTO): Promise<Tecnico | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const adapter = await this.getAdapter();
    const now = new Date().toISOString();

    const nome = data.nome !== undefined ? data.nome.trim() : existing.nome;
    const especialidade = data.especialidade !== undefined ? data.especialidade.trim() : existing.especialidade;
    const telefone = data.telefone !== undefined
      ? (data.telefone && data.telefone.trim() ? data.telefone.trim() : null)
      : existing.telefone;
    const email = data.email !== undefined
      ? (data.email && data.email.trim() ? data.email.trim() : null)
      : existing.email;
    const regiao = data.regiao !== undefined
      ? (data.regiao && data.regiao.trim() ? data.regiao.trim() : null)
      : existing.regiao;
    const status = data.status !== undefined ? data.status : existing.status;

    const sql = `
      UPDATE tecnicos
      SET nome = $1, especialidade = $2, telefone = $3, email = $4, regiao = $5, status = $6, atualizado_em = $7
      WHERE id = $8
      RETURNING *
    `;
    const params = [nome, especialidade, telefone, email, regiao, status, now, id];
    const result = await adapter.query(sql, params);
    return formatTecnico(result.rows[0]);
  }

  async updateDisponibilidade(id: number, status: StatusDisponibilidade): Promise<Tecnico | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const adapter = await this.getAdapter();
    const now = new Date().toISOString();

    const sql = `
      UPDATE tecnicos
      SET status = $1, atualizado_em = $2
      WHERE id = $3
      RETURNING *
    `;
    const params = [status, now, id];
    const result = await adapter.query(sql, params);
    return formatTecnico(result.rows[0]);
  }

  async delete(id: number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    const adapter = await this.getAdapter();
    await adapter.query('DELETE FROM tecnicos WHERE id = $1', [id]);
    return true;
  }

  async checkHealth(): Promise<{ connected: boolean; provider: string }> {
    try {
      const adapter = await this.getAdapter();
      const connected = await adapter.checkConnection();
      return { connected, provider: adapter.getProviderName() };
    } catch {
      return { connected: false, provider: 'Unknown' };
    }
  }
}

export const tecnicoRepository = new TecnicoRepository();
