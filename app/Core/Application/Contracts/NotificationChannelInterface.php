<?php

declare(strict_types=1);

namespace App\Core\Application\Contracts;

/**
 * ISP & DIP: Notification channel contract for technician/operational alerts.
 */
interface NotificationChannelInterface
{
    /**
     * @param array<string, mixed> $context
     */
    public function notify(string $recipient, string $subject, string $message, array $context = []): bool;

    public function getChannelName(): string;
}
