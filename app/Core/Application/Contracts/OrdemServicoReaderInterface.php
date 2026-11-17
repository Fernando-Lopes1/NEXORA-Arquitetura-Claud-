<?php

declare(strict_types=1);

namespace App\Core\Application\Contracts;

use App\Models\OrdemServico;
use Illuminate\Support\Collection;

/**
 * ISP: Segregated read-only interface for Ordem de Serviço queries.
 */
interface OrdemServicoReaderInterface
{
    public function findById(int $id): ?OrdemServico;

    public function findByCodigo(string $codigo): ?OrdemServico;

    public function findByIdOrCodigo(int|string $identifier): ?OrdemServico;

    /**
     * @param array<string, mixed> $filters
     * @return Collection<int, OrdemServico>
     */
    public function listAll(array $filters = []): Collection;
}
