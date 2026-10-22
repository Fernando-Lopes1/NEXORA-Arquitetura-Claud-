<?php

declare(strict_types=1);

namespace App\Core\Application\Services;

use App\Core\Application\Contracts\PricingStrategyInterface;
use App\Core\Application\Strategies\PreventiveMaintenancePricingStrategy;
use App\Core\Application\Strategies\StandardPricingStrategy;
use App\Core\Application\Strategies\UrgentSlaPricingStrategy;

/**
 * SRP, OCP & LSP: PricingCalculatorService delegates pricing rules to interchangeable strategies.
 */
final class PricingCalculatorService
{
    /**
     * @var array<int, PricingStrategyInterface>
     */
    private array $strategies = [];

    private PricingStrategyInterface $defaultStrategy;

    /**
     * @param iterable<PricingStrategyInterface> $strategies
     */
    public function __construct(
        iterable $strategies = [],
        ?PricingStrategyInterface $defaultStrategy = null
    ) {
        $this->defaultStrategy = $defaultStrategy ?? new StandardPricingStrategy();

        foreach ($strategies as $strategy) {
            $this->registerStrategy($strategy);
        }

        if (empty($this->strategies)) {
            $this->registerStrategy(new UrgentSlaPricingStrategy());
            $this->registerStrategy(new PreventiveMaintenancePricingStrategy());
            $this->registerStrategy($this->defaultStrategy);
        }
    }

    public function registerStrategy(PricingStrategyInterface $strategy): void
    {
        $this->strategies[] = $strategy;
    }

    public function calculateWithStrategy(PricingStrategyInterface $strategy, float $baseAmount, string $prioridade = 'Média'): float
    {
        return $strategy->calculate($baseAmount, $prioridade);
    }

    public function calculateForOrder(float $baseAmount, string $prioridade, string $servico = ''): float
    {
        foreach ($this->strategies as $strategy) {
            if ($strategy->supports($prioridade, $servico)) {
                return $strategy->calculate($baseAmount, $prioridade);
            }
        }

        return $this->defaultStrategy->calculate($baseAmount, $prioridade);
    }

    public function resolveStrategy(string $prioridade, string $servico = ''): PricingStrategyInterface
    {
        foreach ($this->strategies as $strategy) {
            if ($strategy->supports($prioridade, $servico)) {
                return $strategy;
            }
        }

        return $this->defaultStrategy;
    }
}
