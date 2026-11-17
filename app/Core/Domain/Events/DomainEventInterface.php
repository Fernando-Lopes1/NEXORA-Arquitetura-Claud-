<?php

declare(strict_types=1);

namespace App\Core\Domain\Events;

use DateTimeImmutable;

interface DomainEventInterface
{
    public function eventId(): string;

    public function aggregateId(): string;

    public function aggregateType(): string;

    public function eventType(): string;

    public function version(): int;

    public function occurredOn(): DateTimeImmutable;

    /**
     * @return array<string, mixed>
     */
    public function payload(): array;

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array;

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array;
}
