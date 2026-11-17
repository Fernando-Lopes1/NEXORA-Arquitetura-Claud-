<?php

declare(strict_types=1);

namespace App\Core\Application\Commands;

use App\Core\Application\Contracts\CommandInterface;

final readonly class ConcluirOrdemServicoCommand implements CommandInterface
{
    public function __construct(
        public int|string $ordemIdOuCodigo,
        public ?float $valorFinal = null,
        public ?string $observacoes = null
    ) {
    }
}
