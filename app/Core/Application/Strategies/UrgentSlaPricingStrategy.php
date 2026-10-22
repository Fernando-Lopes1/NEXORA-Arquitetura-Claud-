<?php

declare(strict_types=1);

namespace App\Core\Application\Strategies;

use App\Core\Application\Contracts\PricingStrategyInterface;

/**
 * OCP & LSP: Urgent SLA pricing strategy (+25% emergency SLA surcharge).
 */
final class UrgentSlaPricingStrategy implements PricingStrategyInterface
{
    public function supports(string $prioridade, string $servico = ''): bool
    {
        return $prioridade === 'Urgente' || str_contains(mb_strtolower($servico), 'emergencial');
    }

    public function calculate(float $baseAmount, string $prioridade = 'Urgente'): float
    {
        if ($baseAmount <= 0) {
            return 0.0;
        }

        return round($baseAmount * 1.25, 2);
    }

    public function getName(): string
    {
        return 'UrgentSlaPricing';
    }
}
