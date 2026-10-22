<?php

declare(strict_types=1);

namespace App\Core\Application\Contracts;

use App\Models\OrdemServico;

/**
 * ISP: Segregated write-only interface for Ordem de Serviço mutations.
 */
interface OrdemServicoWriterInterface
{
    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): OrdemServico;

    public function save(OrdemServico $ordem): OrdemServico;

    public function delete(int|string $identifier): bool;
}
