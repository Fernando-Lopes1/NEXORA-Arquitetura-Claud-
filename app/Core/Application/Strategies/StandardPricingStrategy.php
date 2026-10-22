<?php

declare(strict_types=1);

namespace App\Core\Application\Strategies;

use App\Core\Application\Contracts\PricingStrategyInterface;

/**
 * OCP & LSP: Standard pricing strategy (no surcharge, preserves base amount).
 */
final class StandardPricingStrategy implements PricingStrategyInterface
{
    public function supports(string $prioridade, string $servico = ''): bool
    {
        return in_array($prioridade, ['Baixa', 'Média', 'Alta'], true);
    }

    public function calculate(float $baseAmount, string $prioridade = 'Média'): float
    {
        return round(max(0.0, $baseAmount), 2);
    }

    public function getName(): string
    {
        return 'StandardPricing';
    }
}
