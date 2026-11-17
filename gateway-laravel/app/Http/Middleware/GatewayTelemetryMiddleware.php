<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class GatewayTelemetryMiddleware
{
    /**
     * Intercepta a requisição, injeta Correlation ID e registra tempo de execução.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        // Propaga Correlation ID recebido ou gera um novo UUID v4
        $correlationId = $request->header('X-Correlation-Id');
        if (empty($correlationId)) {
            $correlationId = (string) Str::uuid();
        }

        // Armazena no request para reuso interno
        $request->attributes->set('correlation_id', $correlationId);

        /** @var Response $response */
        $response = $next($request);

        $executionTimeMs = round((microtime(true) - $startTime) * 1000, 2);

        // Injeta headers de governança e rastreabilidade distribuída no Gateway
        $response->headers->set('X-Correlation-Id', $correlationId);
        $response->headers->set('X-Gateway-Processed-By', 'NEXORA-Laravel-API-Gateway');
        $response->headers->set('X-Gateway-Execution-Time-Ms', (string) $executionTimeMs);

        return $response;
    }
}
