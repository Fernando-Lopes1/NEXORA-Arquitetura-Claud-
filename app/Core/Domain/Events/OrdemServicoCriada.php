<?php

declare(strict_types=1);

namespace App\Core\Domain\Events;

use DateTimeImmutable;

final class OrdemServicoCriada extends AbstractDomainEvent
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        string $aggregateId,
        public readonly string $cliente,
        public readonly string $servico,
        public readonly string $prioridade,
        public readonly float $valorEstimadoReais,
        public readonly int $valorEstimadoCentavos,
        public readonly int $slaHoras,
        public readonly ?string $observacoes = null,
        int $version = 1,
        array $metadata = [],
        ?string $eventId = null,
        ?DateTimeImmutable $occurredOn = null,
    ) {
        parent::__construct(
            aggregateId: $aggregateId,
            payload: [
                'codigo' => $aggregateId,
                'cliente' => $cliente,
                'servico' => $servico,
                'prioridade' => $prioridade,
                'situacao' => 'Aberta',
                'valor_estimado_reais' => $valorEstimadoReais,
                'valor_estimado_centavos' => $valorEstimadoCentavos,
                'sla_horas' => $slaHoras,
                'observacoes' => $observacoes,
            ],
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }

    public function eventType(): string
    {
        return 'OrdemServicoCriada';
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, mixed> $metadata
     */
    public static function fromStoredRecord(
        string $aggregateId,
        array $payload,
        int $version,
        array $metadata = [],
        ?string $eventId = null,
        ?DateTimeImmutable $occurredOn = null,
    ): self {
        return new self(
            aggregateId: $aggregateId,
            cliente: (string) ($payload['cliente'] ?? ''),
            servico: (string) ($payload['servico'] ?? ''),
            prioridade: (string) ($payload['prioridade'] ?? 'Média'),
            valorEstimadoReais: (float) ($payload['valor_estimado_reais'] ?? 0.0),
            valorEstimadoCentavos: (int) ($payload['valor_estimado_centavos'] ?? 0),
            slaHoras: (int) ($payload['sla_horas'] ?? 24),
            observacoes: isset($payload['observacoes']) ? (string) $payload['observacoes'] : null,
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }
}
