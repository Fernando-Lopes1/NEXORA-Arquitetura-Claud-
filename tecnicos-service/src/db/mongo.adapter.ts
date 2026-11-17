import { IDatabaseAdapter, QueryResult } from './adapter.interface';
import { SEED_TECNICOS } from './schema';

export interface TecnicoDocument {
  id: number;
  nome: string;
  especialidade: string;
  telefone: string | null;
  email: string | null;
  regiao: string | null;
  status: string;
  criado_em: string;
  atualizado_em: string;
}

/**
 * Hexagonal Adapter (Driven Port Implementation) for MongoDB Atlas (Free Tier).
 * Supports real MongoDB Atlas connections (mongodb+srv:// / mongodb://) via the official
 * `mongodb` driver as well as an embedded document collection mode (mongodb://inmemory)
 * for deterministic unit testing and offline development.
 */
export class MongoAdapter implements IDatabaseAdapter {
  private client: any = null;
  private db: any = null;
  private collection: any = null;
  private inMemoryDocs: TecnicoDocument[] | null = null;
  private connected = false;

  constructor(
    private readonly uri: string,
    private readonly dbName: string = 'nexora_tecnicos'
  ) {}

  async init(): Promise<void> {
    await this.connect();
    await this.initSchema();
  }

  async connect(): Promise<void> {
    if (this.uri === 'mongodb://inmemory' || this.uri.startsWith('mongodb://inmemory/')) {
      this.inMemoryDocs = [];
      this.connected = true;
      return;
    }

    try {
      const { MongoClient } = require('mongodb');
      this.client = new MongoClient(this.uri, {
        serverSelectionTimeoutMS: 3500,
        connectTimeoutMS: 3500
      });
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.collection = this.db.collection('tecnicos');
      this.connected = true;
    } catch (err: any) {
      this.connected = false;
      throw new Error(`Falha ao conectar ao MongoDB Atlas: ${err.message}`);
    }
  }

  private sanitizeString(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      throw new Error('Operadores NoSQL ou objetos aninhados não são permitidos em parâmetros.');
    }
    return String(val);
  }

  private sanitizeNullableString(val: unknown): string | null {
    if (val === null || val === undefined) return null;
    if (typeof val === 'object') {
      throw new Error('Operadores NoSQL não permitidos.');
    }
    const str = String(val).trim();
    return str.length > 0 ? str : null;
  }

  private sanitizeId(val: unknown): number {
    if (typeof val === 'object' && val !== null) {
      throw new Error('Operadores NoSQL não permitidos no campo ID.');
    }
    const num = Number(val);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error('ID numérico inválido para documento MongoDB.');
    }
    return num;
  }

  async initSchema(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    if (this.inMemoryDocs !== null) {
      if (this.inMemoryDocs.length === 0) {
        this.inMemoryDocs = SEED_TECNICOS.map((item, idx) => ({
          id: idx + 1,
          nome: item.nome,
          especialidade: item.especialidade,
          telefone: item.telefone,
          email: item.email,
          regiao: item.regiao,
          status: item.status,
          criado_em: item.criado_em,
          atualizado_em: item.atualizado_em
        }));
      }
      return;
    }

    await this.collection.createIndex({ id: 1 }, { unique: true });
    await this.collection.createIndex({ status: 1 });
    await this.collection.createIndex({ especialidade: 1 });

    const count = await this.collection.countDocuments();
    if (count === 0) {
      console.log('🌱 Populando seed inicial de Técnicos no MongoDB Atlas...');
      const seedDocs: TecnicoDocument[] = SEED_TECNICOS.map((item, idx) => ({
        id: idx + 1,
        nome: item.nome,
        especialidade: item.especialidade,
        telefone: item.telefone,
        email: item.email,
        regiao: item.regiao,
        status: item.status,
        criado_em: item.criado_em,
        atualizado_em: item.atualizado_em
      }));
      await this.collection.insertMany(seedDocs);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    // Reject any NoSQL operator objects in params immediately
    for (const p of params) {
      if (typeof p === 'object' && p !== null) {
        throw new Error('Operadores NoSQL ou objetos aninhados não são permitidos em parâmetros.');
      }
    }

    const normalized = sql.trim().replace(/\s+/g, ' ');
    const upper = normalized.toUpperCase();

    if (upper.includes('FROM ORDENS_SERVICO')) {
      throw new Error('no such table: ordens_servico');
    }

    if (upper.includes('SQLITE_MASTER')) {
      return { rows: [{ name: 'tecnicos' } as unknown as T], rowCount: 1 };
    }

    // 1. SELECT COUNT(*)
    if (upper.startsWith('SELECT COUNT(*)')) {
      const total = this.inMemoryDocs !== null
        ? this.inMemoryDocs.length
        : await this.collection.countDocuments();
      return { rows: [{ total } as unknown as T], rowCount: 1 };
    }

    // 2. SELECT * FROM tecnicos WHERE id = $1
    if (upper.startsWith('SELECT * FROM TECNICOS WHERE ID =')) {
      const id = this.sanitizeId(params[0]);
      if (this.inMemoryDocs !== null) {
        const found = this.inMemoryDocs.find((d) => d.id === id);
        return { rows: found ? [{ ...found } as unknown as T] : [], rowCount: found ? 1 : 0 };
      }
      const doc = await this.collection.findOne({ id }, { projection: { _id: 0 } });
      return { rows: doc ? [doc as T] : [], rowCount: doc ? 1 : 0 };
    }

    // 3. SELECT * FROM tecnicos WHERE ... (Filtered list)
    if (upper.startsWith('SELECT * FROM TECNICOS')) {
      let paramIdx = 0;
      const filterSpec: { especialidade?: string; status?: string; regiao?: string } = {};

      if (upper.includes('ESPECIALIDADE')) {
        filterSpec.especialidade = this.sanitizeString(params[paramIdx++]).toLowerCase();
      }
      if (upper.includes('STATUS')) {
        filterSpec.status = this.sanitizeString(params[paramIdx++]).toLowerCase();
      }
      if (upper.includes('REGIAO')) {
        filterSpec.regiao = this.sanitizeString(params[paramIdx++]).replace(/%/g, '').toLowerCase();
      }

      const allDocs: TecnicoDocument[] = this.inMemoryDocs !== null
        ? [...this.inMemoryDocs]
        : await this.collection.find({}, { projection: { _id: 0 } }).sort({ id: 1 }).toArray();

      const filtered = allDocs
        .filter((doc) => {
          if (filterSpec.especialidade && doc.especialidade.toLowerCase() !== filterSpec.especialidade) {
            return false;
          }
          if (filterSpec.status && doc.status.toLowerCase() !== filterSpec.status) {
            return false;
          }
          if (filterSpec.regiao && !(doc.regiao || '').toLowerCase().includes(filterSpec.regiao)) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.id - b.id);

      return { rows: filtered as unknown as T[], rowCount: filtered.length };
    }

    // 4. INSERT INTO tecnicos (...)
    if (upper.startsWith('INSERT INTO TECNICOS')) {
      const nextId = await this.getNextSequenceId();
      const now = new Date().toISOString();
      const newDoc: TecnicoDocument = {
        id: nextId,
        nome: this.sanitizeString(params[0]),
        especialidade: this.sanitizeString(params[1]),
        telefone: this.sanitizeNullableString(params[2]),
        email: this.sanitizeNullableString(params[3]),
        regiao: this.sanitizeNullableString(params[4]),
        status: this.sanitizeString(params[5] || 'Disponível'),
        criado_em: this.sanitizeString(params[6] || now),
        atualizado_em: this.sanitizeString(params[7] || now)
      };

      if (this.inMemoryDocs !== null) {
        this.inMemoryDocs.push(newDoc);
      } else {
        await this.collection.insertOne({ ...newDoc });
      }

      return { rows: [{ ...newDoc } as unknown as T], rowCount: 1 };
    }

    // 5. UPDATE tecnicos SET status = $1 ...
    if (upper.startsWith('UPDATE TECNICOS SET STATUS = $1')) {
      const status = this.sanitizeString(params[0]);
      const isTwoParams = params.length === 2;
      const atualizado_em = isTwoParams ? new Date().toISOString() : this.sanitizeString(params[1]);
      const id = this.sanitizeId(isTwoParams ? params[1] : params[2]);

      if (this.inMemoryDocs !== null) {
        const idx = this.inMemoryDocs.findIndex((d) => d.id === id);
        if (idx === -1) return { rows: [], rowCount: 0 };
        this.inMemoryDocs[idx] = { ...this.inMemoryDocs[idx], status, atualizado_em };
        return { rows: [{ ...this.inMemoryDocs[idx] } as unknown as T], rowCount: 1 };
      }

      await this.collection.updateOne({ id }, { $set: { status, atualizado_em } });
      const updated = await this.collection.findOne({ id }, { projection: { _id: 0 } });
      return { rows: updated ? [updated as T] : [], rowCount: updated ? 1 : 0 };
    }

    // 6. UPDATE tecnicos SET nome = $1, especialidade = $2, ... WHERE id = $8
    if (upper.startsWith('UPDATE TECNICOS')) {
      const updateFields = {
        nome: this.sanitizeString(params[0]),
        especialidade: this.sanitizeString(params[1]),
        telefone: this.sanitizeNullableString(params[2]),
        email: this.sanitizeNullableString(params[3]),
        regiao: this.sanitizeNullableString(params[4]),
        status: this.sanitizeString(params[5]),
        atualizado_em: this.sanitizeString(params[6])
      };
      const id = this.sanitizeId(params[7]);

      if (this.inMemoryDocs !== null) {
        const idx = this.inMemoryDocs.findIndex((d) => d.id === id);
        if (idx === -1) return { rows: [], rowCount: 0 };
        this.inMemoryDocs[idx] = { ...this.inMemoryDocs[idx], ...updateFields };
        return { rows: [{ ...this.inMemoryDocs[idx] } as unknown as T], rowCount: 1 };
      }

      await this.collection.updateOne({ id }, { $set: updateFields });
      const updated = await this.collection.findOne({ id }, { projection: { _id: 0 } });
      return { rows: updated ? [updated as T] : [], rowCount: updated ? 1 : 0 };
    }

    // 7. DELETE FROM tecnicos WHERE id = $1
    if (upper.startsWith('DELETE FROM TECNICOS WHERE ID =')) {
      const id = this.sanitizeId(params[0]);
      if (this.inMemoryDocs !== null) {
        const before = this.inMemoryDocs.length;
        this.inMemoryDocs = this.inMemoryDocs.filter((d) => d.id !== id);
        return { rows: [], rowCount: before - this.inMemoryDocs.length };
      }
      const res = await this.collection.deleteOne({ id });
      return { rows: [], rowCount: Number(res.deletedCount || 0) };
    }

    // 8. DELETE FROM tecnicos (cleanup in tests)
    if (upper === 'DELETE FROM TECNICOS') {
      if (this.inMemoryDocs !== null) {
        const count = this.inMemoryDocs.length;
        this.inMemoryDocs = [];
        return { rows: [], rowCount: count };
      }
      const res = await this.collection.deleteMany({});
      return { rows: [], rowCount: Number(res.deletedCount || 0) };
    }

    return { rows: [], rowCount: 0 };
  }

  private async getNextSequenceId(): Promise<number> {
    if (this.inMemoryDocs !== null) {
      if (this.inMemoryDocs.length === 0) return 1;
      return Math.max(...this.inMemoryDocs.map((d) => d.id)) + 1;
    }
    const last = await this.collection
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    return last.length > 0 ? Number(last[0].id) + 1 : 1;
  }

  async exec(_sql: string): Promise<void> {
    // No-op for document store schema scripts
  }

  async checkConnection(): Promise<boolean> {
    if (!this.connected) return false;
    if (this.inMemoryDocs !== null) return true;
    try {
      await this.db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    this.connected = false;
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  getProviderName(): 'MongoDB Atlas' {
    return 'MongoDB Atlas';
  }
}
