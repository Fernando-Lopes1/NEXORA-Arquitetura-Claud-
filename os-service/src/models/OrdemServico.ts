export type StatusOS = 'Aberta' | 'Agendada' | 'Em Execução' | 'Concluída' | 'Cancelada';
export type PrioridadeOS = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface OrdemServico {
  id: number;
  cliente: string;
  descricao: string;
  tecnico: string | null;
  tecnico_atribuido?: string | null;
  prioridade: PrioridadeOS;
  status: StatusOS;
  valor_estimado: number;
  prazo: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateOrdemDTO {
  cliente: string;
  descricao: string;
  tecnico?: string | null;
  tecnico_atribuido?: string | null;
  prioridade?: PrioridadeOS;
  status?: StatusOS;
  valor_estimado?: number;
  prazo?: string | null;
}

export interface UpdateOrdemDTO {
  cliente?: string;
  descricao?: string;
  tecnico?: string | null;
  tecnico_atribuido?: string | null;
  prioridade?: PrioridadeOS;
  status?: StatusOS;
  valor_estimado?: number;
  prazo?: string | null;
}

export interface UpdateStatusDTO {
  status: StatusOS;
  tecnico?: string | null;
  tecnico_atribuido?: string | null;
}

export interface OrdemFilter {
  status?: string;
  prioridade?: string;
  cliente?: string;
}

export const VALID_STATUSES: StatusOS[] = [
  'Aberta',
  'Agendada',
  'Em Execução',
  'Concluída',
  'Cancelada'
];

export const VALID_PRIORIDADES: PrioridadeOS[] = [
  'Baixa',
  'Média',
  'Alta',
  'Urgente'
];
