<?php

declare(strict_types=1);

namespace App\Core\Domain\Events;

use DateTimeImmutable;
use Illuminate\Support\Str;

abstract class AbstractDomainEvent implements DomainEventInterface
{
    protected string $eventId;
    protected DateTimeImmutable $occurredOn;

    /**
     * @param array<string, mixed> $payload
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        protected string $aggregateId,
        protected array $payload = [],
        protected int $version = 1,
        protected array $metadata = [],
        ?string $eventId = null,
        ?DateTimeImmutable $occurredOn = null,
    ) {
        $this->eventId = $eventId ?? (string) Str::uuid();
        $this->occurredOn = $occurredOn ?? new DateTimeImmutable('now');

        if (!isset($this->metadata['source'])) {
            $this->metadata['source'] = 'NEXORA-Core-Domain';
        }
        if (!isset($this->metadata['schema_version'])) {
            $this->metadata['schema_version'] = '1.0';
        }
    }

    public function eventId(): string
    {
        return $this->eventId;
    }

    public function aggregateId(): string
    {
        return $this->aggregateId;
    }

    public function aggregateType(): string
    {
        return 'OrdemServicoAggregate';
    }

    public function version(): int
    {
        return $this->version;
    }

    public function occurredOn(): DateTimeImmutable
    {
        return $this->occurredOn;
    }

    public function payload(): array
    {
        return $this->payload;
    }

    public function metadata(): array
    {
        return $this->metadata;
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->eventId(),
            'aggregate_type' => $this->aggregateType(),
            'aggregate_id' => $this->aggregateId(),
            'event_type' => $this->eventType(),
            'version' => $this->version(),
            'payload' => $this->payload(),
            'metadata' => $this->metadata(),
            'occurred_on' => $this->occurredOn()->format('Y-m-d H:i:s'),
        ];
    }
}
