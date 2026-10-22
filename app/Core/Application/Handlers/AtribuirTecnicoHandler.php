<?php

declare(strict_types=1);

namespace App\Core\Application\Handlers;

use App\Core\Application\Commands\AtribuirTecnicoCommand;
use App\Core\Application\Contracts\NotificationChannelInterface;
use App\Core\Application\Contracts\OrdemServicoReaderInterface;
use App\Core\Application\Contracts\OrdemServicoWriterInterface;
use App\Models\OrdemServico;
use App\Models\Tecnico;
use InvalidArgumentException;

/**
 * SRP & DIP: Command Handler for assigning a field technician to a work order.
 */
final class AtribuirTecnicoHandler
{
    public function __construct(
        private readonly OrdemServicoReaderInterface $reader,
        private readonly OrdemServicoWriterInterface $writer,
        private readonly NotificationChannelInterface $notificationChannel
    ) {
    }

    public function handle(AtribuirTecnicoCommand $command): OrdemServico
    {
        $ordem = $this->reader->findByIdOrCodigo($command->ordemIdOuCodigo);
        if ($ordem === null) {
            throw new InvalidArgumentException("Ordem de serviço não encontrada: {$command->ordemIdOuCodigo}");
        }

        $tecnico = null;
        if ($command->tecnicoId !== null) {
            $tecnico = Tecnico::find($command->tecnicoId);
        } elseif (!empty($command->tecnicoNome)) {
            $tecnico = Tecnico::where('nome', $command->tecnicoNome)->first();
        }

        if ($tecnico !== null) {
            $ordem->tecnico_id = $tecnico->id;
            $ordem->tecnico_nome = $tecnico->nome;
        } elseif (!empty($command->tecnicoNome)) {
            $ordem->tecnico_id = null;
            $ordem->tecnico_nome = $command->tecnicoNome;
        } else {
            throw new InvalidArgumentException('Técnico inválido para atribuição.');
        }

        if ($ordem->situacao === OrdemServico::STATUS_ABERTA) {
            $ordem->situacao = OrdemServico::STATUS_AGENDADA;
            $ordem->data_agendamento = now();
        }

        $saved = $this->writer->save($ordem);

        $this->notificationChannel->notify(
            recipient: (string) $saved->tecnico_nome,
            subject: "Alocação de OS {$saved->codigo}",
            message: "Você foi designado para atender a OS {$saved->codigo} ({$saved->cliente}).",
            context: ['ordem_id' => $saved->id, 'codigo' => $saved->codigo]
        );

        return $saved;
    }
}
