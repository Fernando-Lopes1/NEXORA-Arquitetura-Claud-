<?php

declare(strict_types=1);

namespace App\Core\Domain\Events;

use DateTimeImmutable;

final class OrdemServicoConcluida extends AbstractDomainEvent
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        string $aggregateId,
        public readonly float $valorFinalReais,
        public readonly int $valorFinalCentavos,
        public readonly ?string $laudoTecnico = null,
        int $version = 4,
        array $metadata = [],
        ?string $eventId = null,
        ?DateTimeImmutable $occurredOn = null,
    ) {
        parent::__construct(
            aggregateId: $aggregateId,
            payload: [
                'codigo' => $aggregateId,
                'situacao' => 'Concluída',
                'valor_final_reais' => $valorFinalReais,
                'valor_final_centavos' => $valorFinalCentavos,
                'laudo_tecnico' => $laudoTecnico,
            ],
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }

    public function eventType(): string
    {
        return 'OrdemServicoConcluida';
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
            valorFinalReais: (float) ($payload['valor_final_reais'] ?? 0.0),
            valorFinalCentavos: (int) ($payload['valor_final_centavos'] ?? 0),
            laudoTecnico: isset($payload['laudo_tecnico']) ? (string) $payload['laudo_tecnico'] : null,
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }
}
