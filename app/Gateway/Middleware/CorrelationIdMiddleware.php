<?php

namespace App\Gateway\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Global Correlation ID Middleware (Formativa 16)
 *
 * Mirrors CorrelationIdFilter from the reference API Gateway architecture:
 * - Reads incoming X-Correlation-Id header if provided by client/MFE.
 * - Generates a new RFC 4122 UUID v4 if absent or empty.
 * - Propagates X-Correlation-Id into the downstream request and HTTP response.
 */
class CorrelationIdMiddleware
{
    public const HEADER_NAME = 'X-Correlation-Id';

    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = trim((string) $request->header(self::HEADER_NAME, ''));

        if ($correlationId === '') {
            $correlationId = (string) Str::uuid();
        }

        // Propagate to downstream request context
        $request->headers->set(self::HEADER_NAME, $correlationId);

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set(self::HEADER_NAME, $correlationId);

        return $response;
    }
}
