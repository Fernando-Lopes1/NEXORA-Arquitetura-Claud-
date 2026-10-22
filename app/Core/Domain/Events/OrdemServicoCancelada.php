<?php

declare(strict_types=1);

namespace App\Core\Domain\Events;

use DateTimeImmutable;

final class OrdemServicoCancelada extends AbstractDomainEvent
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        string $aggregateId,
        public readonly string $motivoCancelamento,
        public readonly bool $origemCompensacaoSaga = false,
        int $version = 2,
        array $metadata = [],
        ?string $eventId = null,
        ?DateTimeImmutable $occurredOn = null,
    ) {
        parent::__construct(
            aggregateId: $aggregateId,
            payload: [
                'codigo' => $aggregateId,
                'situacao' => 'Cancelada',
                'motivo_cancelamento' => $motivoCancelamento,
                'origem_compensacao_saga' => $origemCompensacaoSaga,
            ],
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }

    public function eventType(): string
    {
        return 'OrdemServicoCancelada';
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
            motivoCancelamento: (string) ($payload['motivo_cancelamento'] ?? 'Cancelamento operacional'),
            origemCompensacaoSaga: (bool) ($payload['origem_compensacao_saga'] ?? false),
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }
}
