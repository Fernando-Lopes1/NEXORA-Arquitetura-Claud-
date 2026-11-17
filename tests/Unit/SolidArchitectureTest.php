<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Application\Channels\LogNotificationChannel;
use App\Core\Application\Channels\WebhookNotificationChannel;
use App\Core\Application\Contracts\CommandBusInterface;
use App\Core\Application\Contracts\NotificationChannelInterface;
use App\Core\Application\Contracts\OrdemServicoReaderInterface;
use App\Core\Application\Contracts\OrdemServicoWriterInterface;
use App\Core\Application\Contracts\PricingStrategyInterface;
use App\Core\Application\Contracts\QueryBusInterface;
use App\Core\Application\Services\PricingCalculatorService;
use App\Core\Application\Strategies\PreventiveMaintenancePricingStrategy;
use App\Core\Application\Strategies\StandardPricingStrategy;
use App\Core\Application\Strategies\UrgentSlaPricingStrategy;
use App\Core\Infrastructure\Persistence\EloquentOrdemServicoRepository;
use Tests\TestCase;

class SolidArchitectureTest extends TestCase
{
    public function test_ocp_and_lsp_pricing_strategies_are_interchangeable_in_calculator(): void
    {
        $calculator = new PricingCalculatorService([
            new UrgentSlaPricingStrategy(),
            new PreventiveMaintenancePricingStrategy(),
            new StandardPricingStrategy(),
        ]);

        // Standard strategy: preserves base amount (1000.00 -> 1000.00)
        $standardAmount = $calculator->calculateForOrder(1000.00, 'Média', 'Instalação de sensores');
        $this->assertSame(1000.00, $standardAmount);

        // Urgent SLA strategy: +25% surcharge (1000.00 -> 1250.00)
        $urgentAmount = $calculator->calculateForOrder(1000.00, 'Urgente', 'Reparo emergencial em gerador');
        $this->assertSame(1250.00, $urgentAmount);

        // Preventive Maintenance strategy: 10% discount (1000.00 -> 900.00)
        $preventiveAmount = $calculator->calculateForOrder(1000.00, 'Alta', 'Manutenção preventiva periódica');
        $this->assertSame(900.00, $preventiveAmount);
    }

    public function test_lsp_notification_channels_honor_contract_invariants(): void
    {
        $channels = [
            new LogNotificationChannel(),
            new WebhookNotificationChannel('https://hooks.nexora.internal/test'),
        ];

        foreach ($channels as $channel) {
            $this->assertInstanceOf(NotificationChannelInterface::class, $channel);
            $result = $channel->notify(
                recipient: 'Henrique Ricardo',
                subject: 'Teste LSP',
                message: 'Verificação de substituição de Liskov',
                context: ['os' => 'OS-1001']
            );
            $this->assertTrue($result);
            $this->assertNotEmpty($channel->getChannelName());
        }
    }

    public function test_isp_and_dip_container_bindings_resolve_segregated_interfaces(): void
    {
        $reader = $this->app->make(OrdemServicoReaderInterface::class);
        $writer = $this->app->make(OrdemServicoWriterInterface::class);
        $commandBus = $this->app->make(CommandBusInterface::class);
        $queryBus = $this->app->make(QueryBusInterface::class);
        $pricingStrategy = $this->app->make(PricingStrategyInterface::class);
        $notifier = $this->app->make(NotificationChannelInterface::class);

        $this->assertInstanceOf(EloquentOrdemServicoRepository::class, $reader);
        $this->assertInstanceOf(EloquentOrdemServicoRepository::class, $writer);
        $this->assertInstanceOf(CommandBusInterface::class, $commandBus);
        $this->assertInstanceOf(QueryBusInterface::class, $queryBus);
        $this->assertInstanceOf(PricingStrategyInterface::class, $pricingStrategy);
        $this->assertInstanceOf(NotificationChannelInterface::class, $notifier);
    }
}
