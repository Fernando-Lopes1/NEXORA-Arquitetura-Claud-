<?php

declare(strict_types=1);

namespace App\Core\Application\Commands;

use App\Core\Application\Contracts\CommandInterface;

final readonly class CriarOrdemServicoCommand implements CommandInterface
{
    /**
     * @param array<int, array<string, mixed>> $itens
     */
    public function __construct(
        public string $cliente,
        public string $servico,
        public string $prioridade = 'Média',
        public string $situacao = 'Aberta',
        public float $valorEstimado = 0.0,
        public ?int $tecnicoId = null,
        public ?string $tecnicoNome = null,
        public ?string $codigo = null,
        public ?string $observacoes = null,
        public array $itens = [],
        public bool $applyPricingStrategy = false
    ) {
    }
}
