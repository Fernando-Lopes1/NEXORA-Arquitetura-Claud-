export const TECNICOS_SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS tecnicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  especialidade TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  regiao TEXT,
  status TEXT NOT NULL DEFAULT 'Disponível',
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tecnicos_status ON tecnicos (status);
CREATE INDEX IF NOT EXISTS idx_tecnicos_especialidade ON tecnicos (especialidade);
CREATE INDEX IF NOT EXISTS idx_tecnicos_regiao ON tecnicos (regiao);
`;

export const TECNICOS_POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS tecnicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  especialidade VARCHAR(100) NOT NULL,
  telefone VARCHAR(50),
  email VARCHAR(255),
  regiao VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'Disponível',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tecnicos_status ON tecnicos (status);
CREATE INDEX IF NOT EXISTS idx_tecnicos_especialidade ON tecnicos (especialidade);
CREATE INDEX IF NOT EXISTS idx_tecnicos_regiao ON tecnicos (regiao);
`;

export interface SeedTecnico {
  nome: string;
  especialidade: 'Climatização' | 'Elétrica' | 'Refrigeração' | 'Mecânica';
  telefone: string | null;
  email: string | null;
  regiao: string | null;
  status: 'Disponível' | 'Em Atendimento' | 'Ausente';
  criado_em: string;
  atualizado_em: string;
}

export const SEED_TECNICOS: SeedTecnico[] = [
  {
    nome: 'Fernando Lopes',
    especialidade: 'Climatização',
    telefone: '(11) 98765-4321',
    email: 'fernando.lopes@nexora.com.br',
    regiao: 'São Paulo - Zona Sul',
    status: 'Disponível',
    criado_em: new Date(Date.now() - 86400000 * 30).toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    nome: 'Carlos Silva',
    especialidade: 'Elétrica',
    telefone: '(11) 97654-3210',
    email: 'carlos.silva@nexora.com.br',
    regiao: 'São Paulo - Centro',
    status: 'Em Atendimento',
    criado_em: new Date(Date.now() - 86400000 * 20).toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    nome: 'Mariana Souza',
    especialidade: 'Refrigeração',
    telefone: '(11) 96543-2109',
    email: 'mariana.souza@nexora.com.br',
    regiao: 'São Paulo - Zona Oeste',
    status: 'Disponível',
    criado_em: new Date(Date.now() - 86400000 * 15).toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    nome: 'Roberto Mendes',
    especialidade: 'Mecânica',
    telefone: '(11) 95432-1098',
    email: 'roberto.mendes@nexora.com.br',
    regiao: 'São Paulo - Zona Leste',
    status: 'Ausente',
    criado_em: new Date(Date.now() - 86400000 * 10).toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    nome: 'Juliana Lima',
    especialidade: 'Climatização',
    telefone: '(11) 94321-0987',
    email: 'juliana.lima@nexora.com.br',
    regiao: 'São Paulo - Zona Norte',
    status: 'Disponível',
    criado_em: new Date(Date.now() - 86400000 * 5).toISOString(),
    atualizado_em: new Date().toISOString()
  }
];
