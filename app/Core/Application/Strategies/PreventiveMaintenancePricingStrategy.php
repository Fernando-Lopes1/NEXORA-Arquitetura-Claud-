<?php

declare(strict_types=1);

namespace App\Core\Application\Strategies;

use App\Core\Application\Contracts\PricingStrategyInterface;

/**
 * OCP & LSP: Preventive maintenance pricing strategy (10% scheduled preventive discount).
 */
final class PreventiveMaintenancePricingStrategy implements PricingStrategyInterface
{
    public function supports(string $prioridade, string $servico = ''): bool
    {
        return str_contains(mb_strtolower($servico), 'preventiva') && $prioridade !== 'Urgente';
    }

    public function calculate(float $baseAmount, string $prioridade = 'Média'): float
    {
        if ($baseAmount <= 0) {
            return 0.0;
        }

        return round($baseAmount * 0.90, 2);
    }

    public function getName(): string
    {
        return 'PreventiveMaintenancePricing';
    }
}
