<?php

declare(strict_types=1);

namespace App\Core\Application\Channels;

use App\Core\Application\Contracts\NotificationChannelInterface;
use Illuminate\Support\Facades\Log;

/**
 * SRP, LSP & DIP: Webhook notification channel for external integrations.
 */
final class WebhookNotificationChannel implements NotificationChannelInterface
{
    public function __construct(
        private readonly string $endpointUrl = 'https://hooks.nexora.internal/events'
    ) {
    }

    public function notify(string $recipient, string $subject, string $message, array $context = []): bool
    {
        Log::debug("[NEXORA Webhook] Dispatching to {$this->endpointUrl}", [
            'recipient' => $recipient,
            'subject' => $subject,
            'message' => $message,
            'context' => $context,
        ]);

        return true;
    }

    public function getChannelName(): string
    {
        return 'webhook';
    }
}
