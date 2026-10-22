<?php

declare(strict_types=1);

namespace App\Core\Application\Commands;

use App\Core\Application\Contracts\CommandInterface;

final readonly class AtribuirTecnicoCommand implements CommandInterface
{
    public function __construct(
        public int|string $ordemIdOuCodigo,
        public ?int $tecnicoId = null,
        public ?string $tecnicoNome = null
    ) {
    }
}
