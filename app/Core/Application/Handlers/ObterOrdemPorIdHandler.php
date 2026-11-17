<?php

declare(strict_types=1);

namespace App\Core\Application\Handlers;

use App\Core\Application\Contracts\OrdemServicoReaderInterface;
use App\Core\Application\Queries\ObterOrdemPorIdQuery;
use App\Models\OrdemServico;

/**
 * SRP & DIP: Query Handler for fetching a single work order by ID or Code.
 */
final class ObterOrdemPorIdHandler
{
    public function __construct(
        private readonly OrdemServicoReaderInterface $reader
    ) {
    }

    public function handle(ObterOrdemPorIdQuery $query): ?OrdemServico
    {
        return $this->reader->findByIdOrCodigo($query->idOuCodigo);
    }
}
