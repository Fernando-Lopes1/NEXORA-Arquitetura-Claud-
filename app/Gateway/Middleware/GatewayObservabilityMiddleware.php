<?php

namespace App\Gateway\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Global Observability & Telemetry Middleware (Formativa 16)
 *
 * Mirrors GlobalLoggingFilter & Route Metadata mutators from the reference Gateway:
 * - Measures total request execution time in milliseconds.
 * - Resolves the logical downstream route identifier (X-Gateway-Route).
 * - Injects mandatory audit/observability headers on every Gateway response:
 *   - X-Gateway-Processed-By: NEXORA-API-Gateway-BFF
 *   - X-Gateway-Route: ordens-service | alocacoes-service | saga-service | bff-service
 *   - X-Gateway-Execution-Time-Ms: <latency_ms>
 *   - X-Correlation-Id: <uuid>
 */
class GatewayObservabilityMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $correlationId = trim((string) $request->header(CorrelationIdMiddleware::HEADER_NAME, ''));
        if ($correlationId === '') {
            $correlationId = (string) Str::uuid();
            $request->headers->set(CorrelationIdMiddleware::HEADER_NAME, $correlationId);
        }

        /** @var Response $response */
        $response = $next($request);

        $elapsedMs = max(0, round((microtime(true) - $startTime) * 1000, 2));
        $gatewayRoute = $this->resolveGatewayRoute($request);
        $processedBy = (string) config('gateway.processed_by', 'NEXORA-API-Gateway-BFF');

        $response->headers->set('X-Gateway-Processed-By', $processedBy);
        $response->headers->set('X-Gateway-Route', $gatewayRoute);
        $response->headers->set('X-Gateway-Execution-Time-Ms', (string) $elapsedMs);
        $response->headers->set(CorrelationIdMiddleware::HEADER_NAME, $correlationId);

        // Security hardening headers (OWASP / SecureCoder guidelines)
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        return $response;
    }

    /**
     * Resolves target microservice route identifier from the request path.
     */
    public function resolveGatewayRoute(Request $request): string
    {
        $path = '/' . ltrim($request->path(), '/');

        if (str_starts_with($path, '/api/ordens')) {
            return 'ordens-service';
        }

        if (str_starts_with($path, '/api/alocacoes') || str_starts_with($path, '/api/dashboard')) {
            return 'alocacoes-service';
        }

        if (str_starts_with($path, '/api/saga') || str_starts_with($path, '/api/event-store')) {
            return 'saga-service';
        }

        if (str_starts_with($path, '/api/bff')) {
            return 'bff-service';
        }

        return 'bff-service';
    }
}
