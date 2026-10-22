<?php

declare(strict_types=1);

namespace App\Core\Application\Handlers;

use App\Core\Application\Commands\ExcluirOrdemServicoCommand;
use App\Core\Application\Contracts\OrdemServicoWriterInterface;

/**
 * SRP & DIP: Command Handler for deleting a work order.
 */
final class ExcluirOrdemServicoHandler
{
    public function __construct(
        private readonly OrdemServicoWriterInterface $writer
    ) {
    }

    public function handle(ExcluirOrdemServicoCommand $command): bool
    {
        return $this->writer->delete($command->ordemIdOuCodigo);
    }
}
