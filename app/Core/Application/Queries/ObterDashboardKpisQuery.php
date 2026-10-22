<?php

declare(strict_types=1);

namespace App\Core\Application\Queries;

use App\Core\Application\Contracts\QueryInterface;

final readonly class ObterDashboardKpisQuery implements QueryInterface
{
    public function __construct(
        public string $periodo = 'all'
    ) {
    }
}
