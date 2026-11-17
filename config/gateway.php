<?php

return [
    /*
    |--------------------------------------------------------------------------
    | NEXORA API Gateway & BFF Configuration (Formativa 16)
    |--------------------------------------------------------------------------
    |
    | Centralizes routing, upstream microservice definitions, permitted
    | Micro-Frontend (MFE) origins, and observability metadata for Fase 2.
    |
    */

    'name' => env('GATEWAY_NAME', 'NEXORA — API Gateway & BFF (Laravel MVC)'),
    'processed_by' => env('GATEWAY_PROCESSED_BY', 'NEXORA-API-Gateway-BFF'),
    'phase' => 'Fase 2 - Ponto Único Centralizado',
    'port' => (int) env('GATEWAY_PORT', 8080),

    'upstreams' => [
        'ordens_service' => [
            'id' => 'ordens-service',
            'url' => env('ORDENS_SERVICE_URL', 'http://localhost:8081'),
            'port' => 8081,
            'forward_http' => (bool) env('GATEWAY_FORWARD_HTTP', false),
            'timeout_seconds' => (int) env('GATEWAY_TIMEOUT_SECONDS', 5),
        ],
        'alocacoes_service' => [
            'id' => 'alocacoes-service',
            'url' => env('ALOCACOES_SERVICE_URL', 'http://localhost:8082'),
            'port' => 8082,
            'forward_http' => (bool) env('GATEWAY_FORWARD_HTTP', false),
            'timeout_seconds' => (int) env('GATEWAY_TIMEOUT_SECONDS', 5),
        ],
    ],

    'active_routes' => [
        '/api/ordens/**' => env('ORDENS_SERVICE_URL', 'http://localhost:8081') . ' (ordens-service)',
        '/api/alocacoes/**' => env('ALOCACOES_SERVICE_URL', 'http://localhost:8082') . ' (alocacoes-service)',
        '/api/dashboard/**' => env('ALOCACOES_SERVICE_URL', 'http://localhost:8082') . ' (alocacoes-service)',
        '/api/bff/**' => 'Processamento local no Gateway (Composição e Agregação BFF)',
        '/api/saga/**' => 'Orquestrador Saga Distribuído & Event Store (Formativa 17)',
    ],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3004',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3004',
        'http://127.0.0.1:8080',
        'https://nexora-host-fernando.azurewebsites.net',
        'https://nexora-remote-fernando.azurewebsites.net',
        'https://nexora-host-dashboard-fernando.azurewebsites.net',
        'https://nexora-remote-dashboard-fernando.azurewebsites.net',
    ],

    'allowed_origin_patterns' => [
        '#^https://[a-zA-Z0-9-]+\.azurewebsites\.net$#',
        '#^https://[a-zA-Z0-9-]+\.azurestaticapps\.net$#',
    ],

    'exposed_headers' => [
        'X-Correlation-Id',
        'X-Gateway-Processed-By',
        'X-Gateway-Route',
        'X-Gateway-Execution-Time-Ms',
    ],
];
