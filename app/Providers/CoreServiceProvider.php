<?php

declare(strict_types=1);

namespace App\Providers;

use App\Core\Application\Bus\LaravelCommandBus;
use App\Core\Application\Bus\LaravelQueryBus;
use App\Core\Application\Channels\LogNotificationChannel;
use App\Core\Application\Commands\AtribuirTecnicoCommand;
use App\Core\Application\Commands\CancelarOrdemServicoCommand;
use App\Core\Application\Commands\ConcluirOrdemServicoCommand;
use App\Core\Application\Commands\CriarOrdemServicoCommand;
use App\Core\Application\Commands\ExcluirOrdemServicoCommand;
use App\Core\Application\Contracts\CommandBusInterface;
use App\Core\Application\Contracts\NotificationChannelInterface;
use App\Core\Application\Contracts\OrdemServicoReaderInterface;
use App\Core\Application\Contracts\OrdemServicoWriterInterface;
use App\Core\Application\Contracts\PricingStrategyInterface;
use App\Core\Application\Contracts\QueryBusInterface;
use App\Core\Application\Handlers\AtribuirTecnicoHandler;
use App\Core\Application\Handlers\CancelarOrdemServicoHandler;
use App\Core\Application\Handlers\ConcluirOrdemServicoHandler;
use App\Core\Application\Handlers\CriarOrdemServicoHandler;
use App\Core\Application\Handlers\ExcluirOrdemServicoHandler;
use App\Core\Application\Handlers\ListarOrdensHandler;
use App\Core\Application\Handlers\ObterDashboardKpisHandler;
use App\Core\Application\Handlers\ObterOrdemPorIdHandler;
use App\Core\Application\Queries\ListarOrdensQuery;
use App\Core\Application\Queries\ObterDashboardKpisQuery;
use App\Core\Application\Queries\ObterOrdemPorIdQuery;
use App\Core\Application\Services\PricingCalculatorService;
use App\Core\Application\Strategies\PreventiveMaintenancePricingStrategy;
use App\Core\Application\Strategies\StandardPricingStrategy;
use App\Core\Application\Strategies\UrgentSlaPricingStrategy;
use App\Core\Infrastructure\Persistence\EloquentOrdemServicoRepository;
use Illuminate\Support\ServiceProvider;

class CoreServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // 1. ISP & DIP: Segregated Reader and Writer interfaces bound to EloquentOrdemServicoRepository
        $this->app->bind(OrdemServicoReaderInterface::class, EloquentOrdemServicoRepository::class);
        $this->app->bind(OrdemServicoWriterInterface::class, EloquentOrdemServicoRepository::class);

        // 2. OCP, LSP & DIP: Pricing Strategies & Calculator Service
        $this->app->bind(PricingStrategyInterface::class, StandardPricingStrategy::class);
        $this->app->singleton(PricingCalculatorService::class, function () {
            return new PricingCalculatorService([
                new UrgentSlaPricingStrategy(),
                new PreventiveMaintenancePricingStrategy(),
                new StandardPricingStrategy(),
            ]);
        });

        // 3. ISP & DIP: Notification Channel
        $this->app->singleton(NotificationChannelInterface::class, LogNotificationChannel::class);

        // 4. CQRS: Command Bus Registration
        $this->app->singleton(CommandBusInterface::class, function ($app) {
            $bus = new LaravelCommandBus($app);
            $bus->register(CriarOrdemServicoCommand::class, CriarOrdemServicoHandler::class);
            $bus->register(AtribuirTecnicoCommand::class, AtribuirTecnicoHandler::class);
            $bus->register(ConcluirOrdemServicoCommand::class, ConcluirOrdemServicoHandler::class);
            $bus->register(CancelarOrdemServicoCommand::class, CancelarOrdemServicoHandler::class);
            $bus->register(ExcluirOrdemServicoCommand::class, ExcluirOrdemServicoHandler::class);
            return $bus;
        });

        // 5. CQRS: Query Bus Registration
        $this->app->singleton(QueryBusInterface::class, function ($app) {
            $bus = new LaravelQueryBus($app);
            $bus->register(ListarOrdensQuery::class, ListarOrdensHandler::class);
            $bus->register(ObterOrdemPorIdQuery::class, ObterOrdemPorIdHandler::class);
            $bus->register(ObterDashboardKpisQuery::class, ObterDashboardKpisHandler::class);
            return $bus;
        });
    }

    public function boot(): void
    {
    }
}
