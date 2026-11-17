import { config } from '../config/env';
import { TecnicoRepository, tecnicoRepository } from '../db/tecnico.repository';
import { StatusDisponibilidade } from '../models/Tecnico';

export interface OrdemBrokerEvent {
  eventId: string;
  eventType:
    | 'ORDEM_CRIADA'
    | 'ORDEM_ALOCADA'
    | 'ORDEM_EM_EXECUCAO'
    | 'ORDEM_CONCLUIDA'
    | 'ORDEM_CANCELADA';
  ordemId: number;
  cliente: string;
  statusOrdem: string;
  tecnicoNome: string | null;
  tecnicoId?: number | null;
  correlationId?: string;
  timestamp: string;
}

export interface ProcessedBrokerMessage {
  eventId: string;
  eventType: string;
  ordemId: number;
  tecnicoAfetado: string | null;
  tecnicoId: number | null;
  novoStatusDisponibilidade: StatusDisponibilidade | null;
  processedAt: string;
  transport: 'Azure Service Bus' | 'HTTP Broker Bridge';
}

export class ServiceBusConsumer {
  private sbClient: any = null;
  private receiver: any = null;
  private isListening = false;
  private processedMessages: ProcessedBrokerMessage[] = [];

  constructor(private readonly repo: TecnicoRepository = tecnicoRepository) {}

  async start(): Promise<void> {
    if (!config.serviceBusConnectionString) {
      console.log(
        'ℹ️ [Azure Service Bus Consumer] AZURE_SERVICE_BUS_CONNECTION_STRING não definida. Operando com bridge HTTP/Event Bus ativa.'
      );
      return;
    }

    try {
      const { ServiceBusClient } = require('@azure/service-bus');
      this.sbClient = new ServiceBusClient(config.serviceBusConnectionString);
      this.receiver = this.sbClient.createReceiver(config.serviceBusQueue);

      this.receiver.subscribe({
        processMessage: async (brokeredMessage: any) => {
          const body = brokeredMessage.body as OrdemBrokerEvent;
          if (body && body.ordemId) {
            await this.handleOrdemEvent(body, 'Azure Service Bus');
          }
        },
        processError: async (args: any) => {
          console.error('⚠️ Erro no consumidor Azure Service Bus:', args.error?.message || args.error);
        }
      });

      this.isListening = true;
      console.log(
        `✅ [Azure Service Bus Consumer] Escutando fila '${config.serviceBusQueue}' no tecnicos-service!`
      );
    } catch (err: any) {
      console.warn(`⚠️ Não foi possível iniciar listener Azure Service Bus: ${err.message}`);
      this.isListening = false;
    }
  }

  /**
   * Regra de Negócio NEXORA:
   * Sincroniza automaticamente a disponibilidade do Técnico no MongoDB Atlas
   * conforme o ciclo de vida da Ordem de Serviço recebida pelo Broker (Azure Service Bus).
   */
  async handleOrdemEvent(
    event: OrdemBrokerEvent,
    transport: 'Azure Service Bus' | 'HTTP Broker Bridge' = 'Azure Service Bus'
  ): Promise<ProcessedBrokerMessage> {
    let targetTecnico = null;

    if (event.tecnicoId && Number.isInteger(Number(event.tecnicoId)) && Number(event.tecnicoId) > 0) {
      targetTecnico = await this.repo.findById(Number(event.tecnicoId));
    }

    if (!targetTecnico && event.tecnicoNome && event.tecnicoNome.trim().length > 0) {
      const cleanName = event.tecnicoNome.trim().toLowerCase();
      const todos = await this.repo.findAll();
      targetTecnico =
        todos.find((t) => t.nome.toLowerCase() === cleanName) ||
        todos.find((t) => t.nome.toLowerCase().includes(cleanName)) ||
        null;
    }

    let novoStatus: StatusDisponibilidade | null = null;
    const statusNorm = (event.statusOrdem || '').trim();

    if (['Agendada', 'Em Execução', 'Em execução'].includes(statusNorm)) {
      novoStatus = 'Em Atendimento';
    } else if (['Concluída', 'Cancelada'].includes(statusNorm)) {
      novoStatus = 'Disponível';
    } else if (statusNorm === 'Aberta' && targetTecnico) {
      novoStatus = 'Em Atendimento';
    }

    if (targetTecnico && novoStatus) {
      await this.repo.updateDisponibilidade(targetTecnico.id, novoStatus);
    }

    const record: ProcessedBrokerMessage = {
      eventId: event.eventId || `evt-${Date.now()}`,
      eventType: event.eventType || 'ORDEM_ALOCADA',
      ordemId: Number(event.ordemId || 0),
      tecnicoAfetado: targetTecnico ? targetTecnico.nome : event.tecnicoNome || null,
      tecnicoId: targetTecnico ? targetTecnico.id : null,
      novoStatusDisponibilidade: novoStatus,
      processedAt: new Date().toISOString(),
      transport
    };

    this.processedMessages.unshift(record);
    if (this.processedMessages.length > 50) {
      this.processedMessages.pop();
    }

    return record;
  }

  getStatus() {
    return {
      broker: 'Azure Service Bus',
      queue: config.serviceBusQueue,
      queueOrTopic: config.serviceBusQueue,
      connectionConfigured: Boolean(config.serviceBusConnectionString),
      listening: this.isListening,
      totalProcessedMessages: this.processedMessages.length,
      processedCount: this.processedMessages.length,
      recentMessages: this.processedMessages.slice(0, 10),
      recentEvents: this.processedMessages.slice(0, 10)
    };
  }

  async close(): Promise<void> {
    this.isListening = false;
    if (this.receiver) {
      await this.receiver.close();
    }
    if (this.sbClient) {
      await this.sbClient.close();
    }
  }
}

export const serviceBusConsumer = new ServiceBusConsumer();

export function getServiceBusConsumer(): ServiceBusConsumer {
  return serviceBusConsumer;
}
