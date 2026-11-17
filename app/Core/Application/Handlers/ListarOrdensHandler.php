<?php

declare(strict_types=1);

namespace App\Core\Application\Handlers;

use App\Core\Application\Contracts\OrdemServicoReaderInterface;
use App\Core\Application\Queries\ListarOrdensQuery;
use Illuminate\Support\Collection;

/**
 * SRP & DIP: Query Handler for listing and filtering work orders.
 */
final class ListarOrdensHandler
{
    public function __construct(
        private readonly OrdemServicoReaderInterface $reader
    ) {
    }

    public function handle(ListarOrdensQuery $query): Collection
    {
        return $this->reader->listAll([
            'status' => $query->status,
            'prioridade' => $query->prioridade,
            'tecnico_id' => $query->tecnicoId,
            'busca' => $query->busca,
        ]);
    }
}
