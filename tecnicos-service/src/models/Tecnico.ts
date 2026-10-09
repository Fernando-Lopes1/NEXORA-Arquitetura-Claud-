/**
 * Especialidades técnicas homologadas no NEXORA Field Service
 */
export type EspecialidadeTecnico =
  | 'Climatização'
  | 'Elétrica'
  | 'Refrigeração'
  | 'Mecânica';

/**
 * Status de disponibilidade de campo do técnico
 */
export type StatusDisponibilidade =
  | 'Disponível'
  | 'Em Atendimento'
  | 'Ausente';

/**
 * Entidade de Domínio Tecnico
 */
export interface Tecnico {
  id: number;
  nome: string;
  especialidade: EspecialidadeTecnico;
  telefone: string | null;
  email: string | null;
  regiao: string | null;
  status: StatusDisponibilidade;
  criado_em: string;
  atualizado_em: string;
}

/**
 * DTO para cadastro de novo técnico (POST /api/tecnicos)
 */
export interface CreateTecnicoDTO {
  nome: string;
  especialidade: EspecialidadeTecnico;
  telefone?: string | null;
  email?: string | null;
  regiao?: string | null;
  status?: StatusDisponibilidade;
}

/**
 * DTO para atualização de técnico (PUT /api/tecnicos/:id)
 */
export interface UpdateTecnicoDTO {
  nome?: string;
  especialidade?: EspecialidadeTecnico;
  telefone?: string | null;
  email?: string | null;
  regiao?: string | null;
  status?: StatusDisponibilidade;
}

/**
 * DTO para alteração de status de disponibilidade (PATCH /api/tecnicos/:id/disponibilidade)
 */
export interface UpdateDisponibilidadeDTO {
  status: StatusDisponibilidade;
}

/**
 * Filtros de busca para listagem de técnicos (GET /api/tecnicos)
 */
export interface TecnicoFilter {
  especialidade?: string;
  regiao?: string;
  status?: string;
}

/**
 * Lista imutável de especialidades válidas
 */
export const VALID_ESPECIALIDADES: readonly EspecialidadeTecnico[] = [
  'Climatização',
  'Elétrica',
  'Refrigeração',
  'Mecânica'
] as const;

/**
 * Lista imutável de status de disponibilidade válidos
 */
export const VALID_DISPONIBILIDADES: readonly StatusDisponibilidade[] = [
  'Disponível',
  'Em Atendimento',
  'Ausente'
] as const;

/**
 * Regex para validação de formato de e-mail (RFC 5322 simplificado)
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
