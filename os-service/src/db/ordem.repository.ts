import { IDatabaseAdapter } from './adapter.interface';
import { getDatabase } from './factory';
import {
  OrdemServico,
  CreateOrdemDTO,
  UpdateOrdemDTO,
  OrdemFilter,
  PrioridadeOS,
  StatusOS
} from '../models/OrdemServico';

export function formatOrdem(row: any): OrdemServico {
  return {
    id: Number(row.id),
    cliente: String(row.cliente),
    descricao: String(row.descricao),
    tecnico: row.tecnico || null,
    tecnico_atribuido: row.tecnico || null,
    prioridade: row.prioridade as PrioridadeOS,
    status: row.status as StatusOS,
    valor_estimado: Number(row.valor_estimado || 0),
    prazo: row.prazo || null,
    criado_em: typeof row.criado_em === 'object' && row.criado_em instanceof Date
      ? row.criado_em.toISOString()
      : String(row.criado_em),
    atualizado_em: typeof row.atualizado_em === 'object' && row.atualizado_em instanceof Date
      ? row.atualizado_em.toISOString()
      : String(row.atualizado_em)
  };
}

export class OrdemRepository {
  constructor(private adapterProvider?: () => Promise<IDatabaseAdapter>) {}

  private async getAdapter(): Promise<IDatabaseAdapter> {
    if (this.adapterProvider) {
      return this.adapterProvider();
    }
    return getDatabase();
  }

  async findAll(filter?: OrdemFilter): Promise<OrdemServico[]> {
    const adapter = await this.getAdapter();
    let sql = 'SELECT * FROM ordens_servico WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filter?.status && filter.status.trim() !== '') {
      sql += ` AND status = $${paramIndex++}`;
      params.push(filter.status.trim());
    }
    if (filter?.prioridade && filter.prioridade.trim() !== '') {
      sql += ` AND prioridade = $${paramIndex++}`;
      params.push(filter.prioridade.trim());
    }
    if (filter?.cliente && filter.cliente.trim() !== '') {
      sql += ` AND LOWER(cliente) LIKE $${paramIndex++}`;
      params.push(`%${filter.cliente.trim().toLowerCase()}%`);
    }

    sql += ' ORDER BY id DESC';
    const result = await adapter.query(sql, params);
    return result.rows.map(formatOrdem);
  }

  async findById(id: number): Promise<OrdemServico | null> {
    const adapter = await this.getAdapter();
    const result = await adapter.query('SELECT * FROM ordens_servico WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return formatOrdem(result.rows[0]);
  }

  async create(data: CreateOrdemDTO): Promise<OrdemServico> {
    const adapter = await this.getAdapter();
    const now = new Date().toISOString();
    const tecnico = data.tecnico || data.tecnico_atribuido || null;
    const prioridade = data.prioridade || 'Média';
    const status = data.status || 'Aberta';
    const valor = Number(data.valor_estimado || 0);
    const prazo = data.prazo || null;

    const sql = `
      INSERT INTO ordens_servico (cliente, descricao, tecnico, prioridade, status, valor_estimado, prazo, criado_em, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [
      data.cliente.trim(),
      data.descricao.trim(),
      tecnico && tecnico.trim() ? tecnico.trim() : null,
      prioridade,
      status,
      valor,
      prazo,
      now,
      now
    ];

    const result = await adapter.query(sql, params);
    return formatOrdem(result.rows[0]);
  }

  async update(id: number, data: UpdateOrdemDTO): Promise<OrdemServico | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const adapter = await this.getAdapter();
    const now = new Date().toISOString();

    const cliente = data.cliente !== undefined ? data.cliente.trim() : existing.cliente;
    const descricao = data.descricao !== undefined ? data.descricao.trim() : existing.descricao;
    const tecnico = data.tecnico !== undefined
      ? (data.tecnico ? data.tecnico.trim() : null)
      : (data.tecnico_atribuido !== undefined ? (data.tecnico_atribuido ? data.tecnico_atribuido.trim() : null) : existing.tecnico);
    const prioridade = data.prioridade !== undefined ? data.prioridade : existing.prioridade;
    const status = data.status !== undefined ? data.status : existing.status;
    const valor = data.valor_estimado !== undefined ? Number(data.valor_estimado) : existing.valor_estimado;
    const prazo = data.prazo !== undefined ? data.prazo : existing.prazo;

    const sql = `
      UPDATE ordens_servico
      SET cliente = $1, descricao = $2, tecnico = $3, prioridade = $4, status = $5, valor_estimado = $6, prazo = $7, atualizado_em = $8
      WHERE id = $9
      RETURNING *
    `;
    const params = [cliente, descricao, tecnico, prioridade, status, valor, prazo, now, id];
    const result = await adapter.query(sql, params);
    return formatOrdem(result.rows[0]);
  }

  async delete(id: number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    const adapter = await this.getAdapter();
    await adapter.query('DELETE FROM ordens_servico WHERE id = $1', [id]);
    return true;
  }

  async updateStatus(id: number, status: StatusOS, tecnico?: string | null): Promise<OrdemServico | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const adapter = await this.getAdapter();
    const now = new Date().toISOString();

    let sql: string;
    let params: any[];

    if (tecnico !== undefined) {
      sql = `
        UPDATE ordens_servico
        SET status = $1, tecnico = $2, atualizado_em = $3
        WHERE id = $4
        RETURNING *
      `;
      params = [status, tecnico && tecnico.trim() ? tecnico.trim() : null, now, id];
    } else {
      sql = `
        UPDATE ordens_servico
        SET status = $1, atualizado_em = $2
        WHERE id = $3
        RETURNING *
      `;
      params = [status, now, id];
    }

    const result = await adapter.query(sql, params);
    return formatOrdem(result.rows[0]);
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

export const ordemRepository = new OrdemRepository();
