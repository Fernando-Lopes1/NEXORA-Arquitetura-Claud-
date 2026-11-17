<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        implode(',', [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3004',
            'http://localhost:8080',
            'https://nexora-host-fernando.azurewebsites.net',
            'https://nexora-remote-fernando.azurewebsites.net',
            'https://nexora-host-dashboard-fernando.azurewebsites.net',
            'https://nexora-remote-dashboard-fernando.azurewebsites.net',
        ])
    )))),
    'allowed_origins_patterns' => [
        '#^https:\/\/[a-zA-Z0-9-]+\.azurewebsites\.net$#',
        '#^https:\/\/[a-zA-Z0-9-]+\.azurestaticapps\.net$#',
    ],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Correlation-Id', 'X-Requested-With', 'Accept', 'Origin'],
    'exposed_headers' => [
        'X-Correlation-Id',
        'X-Gateway-Processed-By',
        'X-Gateway-Route',
        'X-Gateway-Execution-Time-Ms',
    ],
    'max_age' => 3600,
    'supports_credentials' => false,
];
