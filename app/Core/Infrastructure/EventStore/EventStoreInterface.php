<?php

declare(strict_types=1);

namespace App\Core\Infrastructure\EventStore;

use App\Core\Domain\Aggregates\OrdemServicoAggregate;
use App\Core\Domain\Events\DomainEventInterface;

interface EventStoreInterface
{
    public function append(DomainEventInterface $event): void;

    /**
     * @param iterable<DomainEventInterface> $events
     */
    public function appendAll(iterable $events): void;

    public function saveAggregate(OrdemServicoAggregate $aggregate): void;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getEventsForAggregate(string $aggregateId, string $aggregateType = 'OrdemServicoAggregate'): array;

    public function loadAggregate(string $aggregateId): OrdemServicoAggregate;
}
