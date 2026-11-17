<?php

use App\Gateway\Middleware\CentralizedCorsMiddleware;
use App\Gateway\Middleware\CorrelationIdMiddleware;
use App\Gateway\Middleware\GatewayObservabilityMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Formativa 16: Prepend globally so OPTIONS preflight requests are intercepted
        // before Laravel's built-in HandleCors middleware.
        $middleware->prepend([
            CorrelationIdMiddleware::class,
            GatewayObservabilityMiddleware::class,
            CentralizedCorsMiddleware::class,
        ]);

        $middleware->api(prepend: [
            CorrelationIdMiddleware::class,
            GatewayObservabilityMiddleware::class,
            CentralizedCorsMiddleware::class,
        ]);

        $middleware->alias([
            'gateway.correlation' => CorrelationIdMiddleware::class,
            'gateway.observability' => GatewayObservabilityMiddleware::class,
            'gateway.cors' => CentralizedCorsMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
