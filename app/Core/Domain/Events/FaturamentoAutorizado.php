<?php

declare(strict_types=1);

namespace App\Core\Domain\Events;

use DateTimeImmutable;

final class FaturamentoAutorizado extends AbstractDomainEvent
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        string $aggregateId,
        public readonly string $codigoAutorizacao,
        public readonly float $valorAutorizadoReais,
        public readonly int $valorAutorizadoCentavos,
        int $version = 3,
        array $metadata = [],
        ?string $eventId = null,
        ?DateTimeImmutable $occurredOn = null,
    ) {
        parent::__construct(
            aggregateId: $aggregateId,
            payload: [
                'codigo' => $aggregateId,
                'codigo_autorizacao' => $codigoAutorizacao,
                'valor_autorizado_reais' => $valorAutorizadoReais,
                'valor_autorizado_centavos' => $valorAutorizadoCentavos,
                'faturamento_autorizado' => true,
            ],
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }

    public function eventType(): string
    {
        return 'FaturamentoAutorizado';
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
            codigoAutorizacao: (string) ($payload['codigo_autorizacao'] ?? ''),
            valorAutorizadoReais: (float) ($payload['valor_autorizado_reais'] ?? 0.0),
            valorAutorizadoCentavos: (int) ($payload['valor_autorizado_centavos'] ?? 0),
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }
}
