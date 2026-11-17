<?php

namespace App\Gateway\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Centralized Multi-Origin CORS Middleware (Formativa 16)
 *
 * Centralizes Cross-Origin Resource Sharing at the API Gateway perimeter,
 * supporting all 4 NEXORA Micro-Frontends (local ports :3000, :3001, :3002, :3004
 * and Azure App Service / Static Web App domains) as well as OPTIONS preflight requests.
 */
class CentralizedCorsMiddleware
{
    private const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    private const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Correlation-Id, X-Requested-With, Accept, Origin';
    private const EXPOSED_HEADERS = 'X-Correlation-Id, X-Gateway-Processed-By, X-Gateway-Route, X-Gateway-Execution-Time-Ms';

    public function handle(Request $request, Closure $next): Response
    {
        $allowedOrigin = $this->resolveAllowedOrigin($request);

        if ($request->isMethod('OPTIONS') && $request->is('api/*')) {
            $response = new Response('', Response::HTTP_NO_CONTENT);
            return $this->attachCorsHeaders($response, $allowedOrigin);
        }

        /** @var Response $response */
        $response = $next($request);

        if ($request->is('api/*') || $request->headers->has('Origin')) {
            return $this->attachCorsHeaders($response, $allowedOrigin);
        }

        return $response;
    }

    /**
     * Resolves the allowed origin header value for the incoming request.
     * Note: TODO(security): Wildcard fallback ('*') is only used when no Origin header
     * is sent (e.g., server-to-server or CLI tests) to preserve strict origin validation
     * for browser clients.
     */
    private function resolveAllowedOrigin(Request $request): string
    {
        $origin = trim((string) $request->header('Origin', ''));

        if ($origin === '') {
            return '*';
        }

        $allowedOrigins = config('gateway.allowed_origins', [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3004',
            'http://localhost:8080',
            'https://nexora-host-fernando.azurewebsites.net',
            'https://nexora-remote-fernando.azurewebsites.net',
            'https://nexora-host-dashboard-fernando.azurewebsites.net',
            'https://nexora-remote-dashboard-fernando.azurewebsites.net',
        ]);

        if (in_array($origin, $allowedOrigins, true)) {
            return $origin;
        }

        $patterns = config('gateway.allowed_origin_patterns', [
            '#^https://[a-zA-Z0-9-]+\.azurewebsites\.net$#',
            '#^https://[a-zA-Z0-9-]+\.azurestaticapps\.net$#',
        ]);

        foreach ($patterns as $pattern) {
            if (@preg_match($pattern, $origin) === 1) {
                return $origin;
            }
        }

        return '*';
    }

    private function attachCorsHeaders(Response $response, string $allowedOrigin): Response
    {
        $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        $response->headers->set('Access-Control-Allow-Methods', self::ALLOWED_METHODS);
        $response->headers->set('Access-Control-Allow-Headers', self::ALLOWED_HEADERS);
        $response->headers->set('Access-Control-Expose-Headers', self::EXPOSED_HEADERS);
        $response->headers->set('Access-Control-Max-Age', '3600');
        $response->headers->set('Vary', 'Origin');

        return $response;
    }
}
