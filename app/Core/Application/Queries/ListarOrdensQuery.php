<?php

declare(strict_types=1);

namespace App\Core\Application\Queries;

use App\Core\Application\Contracts\QueryInterface;

final readonly class ListarOrdensQuery implements QueryInterface
{
    public function __construct(
        public ?string $status = null,
        public ?string $prioridade = null,
        public ?int $tecnicoId = null,
        public ?string $busca = null
    ) {
    }
}
