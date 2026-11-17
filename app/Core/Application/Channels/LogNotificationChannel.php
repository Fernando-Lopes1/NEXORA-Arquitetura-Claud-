<?php

declare(strict_types=1);

namespace App\Core\Application\Channels;

use App\Core\Application\Contracts\NotificationChannelInterface;
use Illuminate\Support\Facades\Log;

/**
 * SRP, LSP & DIP: Structured application log notification channel.
 */
final class LogNotificationChannel implements NotificationChannelInterface
{
    /**
     * @var array<int, array<string, mixed>>
     */
    private array $dispatchedMessages = [];

    public function notify(string $recipient, string $subject, string $message, array $context = []): bool
    {
        $payload = [
            'channel' => $this->getChannelName(),
            'recipient' => $recipient,
            'subject' => $subject,
            'message' => $message,
            'context' => $context,
        ];

        $this->dispatchedMessages[] = $payload;
        Log::info("[NEXORA Notification] {$subject}", $payload);

        return true;
    }

    public function getChannelName(): string
    {
        return 'log';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getDispatchedMessages(): array
    {
        return $this->dispatchedMessages;
    }
}
