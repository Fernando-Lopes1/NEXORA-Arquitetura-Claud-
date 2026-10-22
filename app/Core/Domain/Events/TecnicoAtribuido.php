<?php

declare(strict_types=1);

namespace App\Core\Domain\Events;

use DateTimeImmutable;

final class TecnicoAtribuido extends AbstractDomainEvent
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        string $aggregateId,
        public readonly int $tecnicoId,
        public readonly string $tecnicoNome,
        public readonly string $especialidade = 'Geral',
        public readonly string $novaSituacao = 'Agendada',
        int $version = 2,
        array $metadata = [],
        ?string $eventId = null,
        ?DateTimeImmutable $occurredOn = null,
    ) {
        parent::__construct(
            aggregateId: $aggregateId,
            payload: [
                'codigo' => $aggregateId,
                'tecnico_id' => $tecnicoId,
                'tecnico_nome' => $tecnicoNome,
                'especialidade' => $especialidade,
                'situacao' => $novaSituacao,
            ],
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }

    public function eventType(): string
    {
        return 'TecnicoAtribuido';
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
            tecnicoId: (int) ($payload['tecnico_id'] ?? 0),
            tecnicoNome: (string) ($payload['tecnico_nome'] ?? ''),
            especialidade: (string) ($payload['especialidade'] ?? 'Geral'),
            novaSituacao: (string) ($payload['situacao'] ?? 'Agendada'),
            version: $version,
            metadata: $metadata,
            eventId: $eventId,
            occurredOn: $occurredOn,
        );
    }
}
