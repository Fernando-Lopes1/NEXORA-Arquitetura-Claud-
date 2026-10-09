import { StatusOS, VALID_STATUSES } from '../models/OrdemServico';

export interface LifecycleValidationResult {
  valid: boolean;
  error?: string;
}

export class LifecycleValidator {
  public static readonly ALLOWED_STATUSES: StatusOS[] = VALID_STATUSES;

  public static readonly ALLOWED_TRANSITIONS: Record<StatusOS, StatusOS[]> = {
    'Aberta': ['Agendada', 'Cancelada'],
    'Agendada': ['Em Execução', 'Cancelada'],
    'Em Execução': ['Concluída', 'Cancelada'],
    'Concluída': [],
    'Cancelada': []
  };

  public static readonly REQUIRES_TECHNICIAN: StatusOS[] = [
    'Agendada',
    'Em Execução',
    'Concluída'
  ];

  public static isStatusValid(status: any): status is StatusOS {
    return typeof status === 'string' && this.ALLOWED_STATUSES.includes(status as StatusOS);
  }

  public static validateTransition(
    currentStatus: StatusOS,
    targetStatus: StatusOS,
    effectiveTechnician: string | null | undefined
  ): LifecycleValidationResult {
    // 1. Não permitir transição para o mesmo status
    if (currentStatus === targetStatus) {
      return {
        valid: false,
        error: `A ordem de serviço já se encontra no status '${currentStatus}'.`
      };
    }

    // 2. Estados terminais não podem sofrer qualquer transição
    if (currentStatus === 'Concluída' || currentStatus === 'Cancelada') {
      return {
        valid: false,
        error: `Não é permitido alterar o status de uma ordem finalizada ou cancelada (estado terminal '${currentStatus}').`
      };
    }

    // 3. Validar se a transição é permitida na matriz de transições
    const allowed = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      return {
        valid: false,
        error: `Transição inválida: não é permitido alterar status de '${currentStatus}' para '${targetStatus}'. Transições permitidas: ${allowed.join(', ') || 'nenhuma'}.`
      };
    }

    // 4. Estados Agendada, Em Execução e Concluída exigem técnico responsável
    if (this.REQUIRES_TECHNICIAN.includes(targetStatus)) {
      if (!effectiveTechnician || effectiveTechnician.trim() === '') {
        return {
          valid: false,
          error: `A transição para '${targetStatus}' exige um técnico responsável atribuído.`
        };
      }
    }

    return { valid: true };
  }
}
