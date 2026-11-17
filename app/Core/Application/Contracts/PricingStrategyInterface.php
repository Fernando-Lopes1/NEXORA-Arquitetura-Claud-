<?php

declare(strict_types=1);

namespace App\Core\Application\Contracts;

/**
 * OCP & LSP: Pricing calculation strategy contract.
 */
interface PricingStrategyInterface
{
    public function supports(string $prioridade, string $servico = ''): bool;

    public function calculate(float $baseAmount, string $prioridade = 'Média'): float;

    public function getName(): string;
}
