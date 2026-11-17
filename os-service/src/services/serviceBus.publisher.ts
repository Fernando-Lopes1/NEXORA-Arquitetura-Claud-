import { config } from '../config/env';
import { OrdemServico } from '../models/OrdemServico';

export type OrdemBrokerEventType =
  | 'ORDEM_CRIADA'
  | 'ORDEM_ALOCADA'
  | 'ORDEM_EM_EXECUCAO'
  | 'ORDEM_CONCLUIDA'
  | 'ORDEM_CANCELADA';

export interface OrdemBrokerEventPayload {
  eventId: string;
  eventType: OrdemBrokerEventType;
  ordemId: number;
  cliente: string;
  statusOrdem: string;
  tecnicoNome: string | null;
  correlationId?: string;
  timestamp: string;
  transportUsed: 'Azure Service Bus' | 'HTTP Broker Bridge' | 'In-Memory Broker';
}

export class ServiceBusPublisher {
  private sbClient: any = null;
  private sender: any = null;
  private publishedEvents: OrdemBrokerEventPayload[] = [];

  private getSender(): any {
    if (!config.serviceBusConnectionString) {
      return null;
    }
    if (this.sender) {
      return this.sender;
    }
    try {
      const { ServiceBusClient } = require('@azure/service-bus');
      this.sbClient = new ServiceBusClient(config.serviceBusConnectionString);
      this.sender = this.sbClient.createSender(config.serviceBusQueue);
      return this.sender;
    } catch (err: any) {
      console.warn(`⚠️ Falha ao inicializar Azure Service Bus Sender: ${err.message}`);
      return null;
    }
  }

  public resolveEventType(status: string, isNew: boolean = false): OrdemBrokerEventType {
    if (status === 'Concluída') return 'ORDEM_CONCLUIDA';
    if (status === 'Cancelada') return 'ORDEM_CANCELADA';
    if (status === 'Em Execução') return 'ORDEM_EM_EXECUCAO';
    if (status === 'Agendada') return 'ORDEM_ALOCADA';
    return isNew ? 'ORDEM_CRIADA' : 'ORDEM_ALOCADA';
  }

  async publishOrdemEvent(
    ordem: OrdemServico,
    eventType?: OrdemBrokerEventType,
    correlationId?: string
  ): Promise<OrdemBrokerEventPayload> {
    const resolvedType = eventType || this.resolveEventType(ordem.status);
    const payload: OrdemBrokerEventPayload = {
      eventId: `sb-msg-${ordem.id}-${Date.now()}`,
      eventType: resolvedType,
      ordemId: ordem.id,
      cliente: ordem.cliente,
      statusOrdem: ordem.status,
      tecnicoNome: ordem.tecnico || ordem.tecnico_atribuido || null,
      correlationId: correlationId || `corr-${ordem.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      transportUsed: 'In-Memory Broker'
    };

    const sender = this.getSender();
    if (sender) {
      try {
        await sender.sendMessages({
          body: payload,
          messageId: payload.eventId,
          correlationId: payload.correlationId,
          subject: payload.eventType,
          contentType: 'application/json'
        });
        payload.transportUsed = 'Azure Service Bus';
      } catch (err: any) {
        console.warn(`⚠️ Erro ao publicar no Azure Service Bus: ${err.message}`);
      }
    }

    // Dispara também via bridge HTTP assíncrona para garantir sincronização imediata quando em execução local/híbrida
    if (payload.tecnicoNome && config.tecnicosServiceUrl && payload.transportUsed !== 'Azure Service Bus') {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${config.tecnicosServiceUrl.replace(/\/$/, '')}/api/tecnicos/eventos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-Id': payload.correlationId || ''
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) {
          payload.transportUsed = 'HTTP Broker Bridge';
        }
      } catch {
        // Ignore if tecnicos-service is not running in isolated unit test
      }
    }

    this.publishedEvents.unshift(payload);
    if (this.publishedEvents.length > 50) {
      this.publishedEvents.pop();
    }

    return payload;
  }

  getStatus() {
    return {
      broker: 'Azure Service Bus',
      queue: config.serviceBusQueue,
      queueOrTopic: config.serviceBusQueue,
      connectionConfigured: Boolean(config.serviceBusConnectionString),
      totalPublishedMessages: this.publishedEvents.length,
      publishedCount: this.publishedEvents.length,
      recentMessages: this.publishedEvents.slice(0, 10),
      recentEvents: this.publishedEvents.slice(0, 10)
    };
  }

  async close(): Promise<void> {
    if (this.sender) {
      await this.sender.close();
      this.sender = null;
    }
    if (this.sbClient) {
      await this.sbClient.close();
      this.sbClient = null;
    }
  }
}

export const serviceBusPublisher = new ServiceBusPublisher();

export function getServiceBusPublisher(): ServiceBusPublisher {
  return serviceBusPublisher;
}
