<?php

declare(strict_types=1);

namespace App\Core\Infrastructure\EventStore;

use App\Core\Domain\Aggregates\OrdemServicoAggregate;
use App\Core\Domain\Events\DomainEventInterface;
use Illuminate\Support\Facades\DB;

final class SqliteEventStore implements EventStoreInterface
{
    public function append(DomainEventInterface $event): void
    {
        $nextVersion = $this->resolveVersion($event);

        DB::table('event_store')->insert([
            'event_id' => $event->eventId(),
            'aggregate_type' => $event->aggregateType(),
            'aggregate_id' => $event->aggregateId(),
            'event_type' => $event->eventType(),
            'version' => $nextVersion,
            'payload' => json_encode($event->payload(), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'metadata' => json_encode($event->metadata(), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'created_at' => $event->occurredOn()->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * @param iterable<DomainEventInterface> $events
     */
    public function appendAll(iterable $events): void
    {
        foreach ($events as $event) {
            $this->append($event);
        }
    }

    public function saveAggregate(OrdemServicoAggregate $aggregate): void
    {
        $events = $aggregate->pullDomainEvents();
        $this->appendAll($events);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getEventsForAggregate(string $aggregateId, string $aggregateType = 'OrdemServicoAggregate'): array
    {
        $rows = DB::table('event_store')
            ->where('aggregate_type', $aggregateType)
            ->where('aggregate_id', $aggregateId)
            ->orderBy('version', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $payload = is_string($row->payload) ? json_decode($row->payload, true) : (array) $row->payload;
            $metadata = is_string($row->metadata) ? json_decode($row->metadata, true) : (array) $row->metadata;

            $result[] = [
                'id' => (int) $row->id,
                'event_id' => (string) $row->event_id,
                'aggregate_type' => (string) $row->aggregate_type,
                'aggregate_id' => (string) $row->aggregate_id,
                'event_type' => (string) $row->event_type,
                'version' => (int) $row->version,
                'payload' => is_array($payload) ? $payload : [],
                'metadata' => is_array($metadata) ? $metadata : [],
                'created_at' => (string) $row->created_at,
            ];
        }

        return $result;
    }

    public function loadAggregate(string $aggregateId): OrdemServicoAggregate
    {
        $events = $this->getEventsForAggregate($aggregateId);
        return OrdemServicoAggregate::reconstituirDeEventos($events);
    }

    public function nextVersionForAggregate(string $aggregateId, string $aggregateType = 'OrdemServicoAggregate'): int
    {
        $maxVersion = DB::table('event_store')
            ->where('aggregate_type', $aggregateType)
            ->where('aggregate_id', $aggregateId)
            ->max('version');

        return ((int) $maxVersion) + 1;
    }

    private function resolveVersion(DomainEventInterface $event): int
    {
        $exists = DB::table('event_store')
            ->where('aggregate_type', $event->aggregateType())
            ->where('aggregate_id', $event->aggregateId())
            ->where('version', $event->version())
            ->exists();

        if ($exists) {
            return $this->nextVersionForAggregate($event->aggregateId(), $event->aggregateType());
        }

        return $event->version();
    }
}
