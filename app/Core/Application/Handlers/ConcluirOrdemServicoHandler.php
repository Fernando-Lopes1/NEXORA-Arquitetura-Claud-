<?php

declare(strict_types=1);

namespace App\Core\Application\Handlers;

use App\Core\Application\Commands\ConcluirOrdemServicoCommand;
use App\Core\Application\Contracts\NotificationChannelInterface;
use App\Core\Application\Contracts\OrdemServicoReaderInterface;
use App\Core\Application\Contracts\OrdemServicoWriterInterface;
use App\Models\OrdemServico;
use InvalidArgumentException;

/**
 * SRP & DIP: Command Handler for completing a work order.
 */
final class ConcluirOrdemServicoHandler
{
    public function __construct(
        private readonly OrdemServicoReaderInterface $reader,
        private readonly OrdemServicoWriterInterface $writer,
        private readonly NotificationChannelInterface $notificationChannel
    ) {
    }

    public function handle(ConcluirOrdemServicoCommand $command): OrdemServico
    {
        $ordem = $this->reader->findByIdOrCodigo($command->ordemIdOuCodigo);
        if ($ordem === null) {
            throw new InvalidArgumentException("Ordem de serviço não encontrada: {$command->ordemIdOuCodigo}");
        }

        $ordem->situacao = OrdemServico::STATUS_CONCLUIDA;
        $ordem->valor_final = $command->valorFinal ?? (float) $ordem->valor_estimado;
        $ordem->data_conclusao = now();

        if (!empty($command->observacoes)) {
            $ordem->observacoes = trim(($ordem->observacoes ? $ordem->observacoes . "\n" : '') . $command->observacoes);
        }

        $saved = $this->writer->save($ordem);

        $this->notificationChannel->notify(
            recipient: $saved->cliente,
            subject: "Ordem de Serviço {$saved->codigo} Concluída",
            message: "O atendimento técnico da OS {$saved->codigo} foi concluído com sucesso.",
            context: ['codigo' => $saved->codigo, 'valor_final' => $saved->valor_final]
        );

        return $saved;
    }
}
