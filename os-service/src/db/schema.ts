export const OS_SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS ordens_servico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tecnico TEXT,
  prioridade TEXT NOT NULL DEFAULT 'Média',
  status TEXT NOT NULL DEFAULT 'Aberta',
  valor_estimado REAL NOT NULL DEFAULT 0.00,
  prazo TEXT,
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ordens_status ON ordens_servico (status);
CREATE INDEX IF NOT EXISTS idx_ordens_cliente ON ordens_servico (cliente);
`;

export const OS_POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS ordens_servico (
  id SERIAL PRIMARY KEY,
  cliente VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  tecnico VARCHAR(255),
  prioridade VARCHAR(50) NOT NULL DEFAULT 'Média',
  status VARCHAR(50) NOT NULL DEFAULT 'Aberta',
  valor_estimado NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  prazo VARCHAR(50),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ordens_status ON ordens_servico (status);
CREATE INDEX IF NOT EXISTS idx_ordens_cliente ON ordens_servico (cliente);
`;

export interface SeedOrdem {
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

export const SEED_ORDENS: SeedOrdem[] = [
  {
    cliente: 'Condomínio Edifício Alto da XV',
    descricao: 'Manutenção preventiva de 3 splits hi-wall e higienização química',
    tecnico: 'Rafael Lima',
    prioridade: 'Média',
    status: 'Agendada',
    valor_estimado: 450.00,
    prazo: '2026-10-15',
    criado_em: new Date(Date.now() - 86400000 * 2).toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    cliente: 'Padaria Trigo Bom Ltda',
    descricao: 'Câmara fria com ruído anormal no compressor e falha de degelo',
    tecnico: 'Marcelo Duarte',
    prioridade: 'Alta',
    status: 'Em Execução',
    valor_estimado: 1200.00,
    prazo: '2026-10-10',
    criado_em: new Date(Date.now() - 86400000 * 4).toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    cliente: 'Clínica Odontológica Sorriso Sul',
    descricao: 'Instalação de 2 novos aparelhos inverter 12000 BTU nos consultórios 1 e 2',
    tecnico: 'Jonas Sena',
    prioridade: 'Alta',
    status: 'Agendada',
    valor_estimado: 980.00,
    prazo: '2026-10-18',
    criado_em: new Date(Date.now() - 86400000 * 3).toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    cliente: 'Mercado São Braz Comércio',
    descricao: 'Vazamento contínuo de água na evaporadora e cheiro de mofo',
    tecnico: null,
    prioridade: 'Baixa',
    status: 'Aberta',
    valor_estimado: 250.00,
    prazo: '2026-10-20',
    criado_em: new Date(Date.now() - 86400000).toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    cliente: 'Auto Center Faria & Filhos',
    descricao: 'Troca de capacitor da condensadora e reaperto dos bornes elétricos',
    tecnico: 'Elaine Barros',
    prioridade: 'Urgente',
    status: 'Concluída',
    valor_estimado: 350.00,
    prazo: '2026-10-05',
    criado_em: new Date(Date.now() - 86400000 * 7).toISOString(),
    atualizado_em: new Date().toISOString()
  }
];
