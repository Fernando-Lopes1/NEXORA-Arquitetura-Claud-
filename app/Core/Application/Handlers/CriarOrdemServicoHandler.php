<?php

declare(strict_types=1);

namespace App\Core\Application\Handlers;

use App\Core\Application\Commands\CriarOrdemServicoCommand;
use App\Core\Application\Contracts\NotificationChannelInterface;
use App\Core\Application\Contracts\OrdemServicoWriterInterface;
use App\Core\Application\Services\PricingCalculatorService;
use App\Models\OrdemServico;
use App\Models\Tecnico;
use Illuminate\Support\Facades\DB;

/**
 * SRP & DIP: Single-responsibility Command Handler for creating a new Ordem de Serviço.
 */
final class CriarOrdemServicoHandler
{
    public function __construct(
        private readonly OrdemServicoWriterInterface $writer,
        private readonly PricingCalculatorService $pricingCalculator,
        private readonly NotificationChannelInterface $notificationChannel
    ) {
    }

    public function handle(CriarOrdemServicoCommand $command): OrdemServico
    {
        return DB::transaction(function () use ($command) {
            $tecnicoId = $command->tecnicoId;
            $tecnicoNome = $command->tecnicoNome ?? 'Não atribuído';

            if ($tecnicoId !== null) {
                $tecnico = Tecnico::find($tecnicoId);
                if ($tecnico !== null) {
                    $tecnicoNome = $tecnico->nome;
                }
            } elseif (!empty($command->tecnicoNome) && $command->tecnicoNome !== 'Não atribuído') {
                $tecnico = Tecnico::where('nome', $command->tecnicoNome)->first();
                if ($tecnico !== null) {
                    $tecnicoId = $tecnico->id;
                    $tecnicoNome = $tecnico->nome;
                }
            }

            $codigo = $command->codigo;
            if (empty($codigo)) {
                $nextNumber = ((int) OrdemServico::max('id')) + 1001;
                $codigo = 'OS-' . $nextNumber;
                while (OrdemServico::where('codigo', $codigo)->exists()) {
                    $nextNumber++;
                    $codigo = 'OS-' . $nextNumber;
                }
            }

            $valorEstimado = $command->applyPricingStrategy
                ? $this->pricingCalculator->calculateForOrder($command->valorEstimado, $command->prioridade, $command->servico)
                : $command->valorEstimado;

            $ordem = $this->writer->create([
                'codigo' => $codigo,
                'cliente' => $command->cliente,
                'servico' => $command->servico,
                'tecnico_id' => $tecnicoId,
                'tecnico_nome' => $tecnicoNome,
                'prioridade' => $command->prioridade,
                'situacao' => $command->situacao,
                'valor_estimado' => $valorEstimado,
                'observacoes' => $command->observacoes,
                'data_agendamento' => $tecnicoId !== null ? now() : null,
            ]);

            foreach ($command->itens as $item) {
                if (!empty($item['descricao'])) {
                    $qtd = max(1, (int) ($item['quantidade'] ?? 1));
                    $unit = (float) ($item['valor_unitario'] ?? 0.0);
                    $ordem->itens()->create([
                        'descricao' => (string) $item['descricao'],
                        'quantidade' => $qtd,
                        'valor_unitario' => $unit,
                        'valor_total' => $qtd * $unit,
                    ]);
                }
            }

            $this->notificationChannel->notify(
                recipient: $tecnicoNome,
                subject: "Nova Ordem de Serviço {$ordem->codigo}",
                message: "OS {$ordem->codigo} aberta para o cliente {$ordem->cliente}.",
                context: ['codigo' => $ordem->codigo, 'prioridade' => $ordem->prioridade]
            );

            return $ordem->fresh(['tecnico', 'itens']) ?? $ordem;
        });
    }
}
