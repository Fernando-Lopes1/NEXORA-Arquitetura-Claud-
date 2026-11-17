<?php

declare(strict_types=1);

namespace App\Core\Application\Handlers;

use App\Core\Application\Commands\CancelarOrdemServicoCommand;
use App\Core\Application\Contracts\NotificationChannelInterface;
use App\Core\Application\Contracts\OrdemServicoReaderInterface;
use App\Core\Application\Contracts\OrdemServicoWriterInterface;
use App\Models\OrdemServico;
use InvalidArgumentException;

/**
 * SRP & DIP: Command Handler for cancelling a work order.
 */
final class CancelarOrdemServicoHandler
{
    public function __construct(
        private readonly OrdemServicoReaderInterface $reader,
        private readonly OrdemServicoWriterInterface $writer,
        private readonly NotificationChannelInterface $notificationChannel
    ) {
    }

    public function handle(CancelarOrdemServicoCommand $command): OrdemServico
    {
        $ordem = $this->reader->findByIdOrCodigo($command->ordemIdOuCodigo);
        if ($ordem === null) {
            throw new InvalidArgumentException("Ordem de serviço não encontrada: {$command->ordemIdOuCodigo}");
        }

        $ordem->situacao = OrdemServico::STATUS_CANCELADA;
        if (!empty($command->motivo)) {
            $ordem->observacoes = trim(($ordem->observacoes ? $ordem->observacoes . "\n" : '') . 'Cancelamento: ' . $command->motivo);
        }

        $saved = $this->writer->save($ordem);

        $this->notificationChannel->notify(
            recipient: (string) ($saved->tecnico_nome ?? 'Central de Operações'),
            subject: "OS {$saved->codigo} Cancelada",
            message: "A Ordem de Serviço {$saved->codigo} foi cancelada.",
            context: ['codigo' => $saved->codigo, 'motivo' => $command->motivo]
        );

        return $saved;
    }
}
