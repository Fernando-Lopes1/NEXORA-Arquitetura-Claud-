<?php

declare(strict_types=1);

namespace App\Core\Saga\Steps;

use App\Core\Domain\Aggregates\OrdemServicoAggregate;
use App\Core\Infrastructure\EventStore\SqliteEventStore;
use App\Core\Saga\SagaContext;
use App\Core\Saga\SagaStepInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class CriarOrdemStep implements SagaStepInterface
{
    public function __construct(
        private readonly SqliteEventStore $eventStore,
    ) {}

    public function name(): string
    {
        return 'CriarOrdemStep';
    }

    public function compensationName(): string
    {
        return 'CancelarOrdemCompensacao';
    }

    public function execute(SagaContext $ctx): bool
    {
        $aggregate = OrdemServicoAggregate::criar(
            codigo: $ctx->ordemCodigo,
            cliente: $ctx->cliente,
            servico: $ctx->servico,
            prioridade: $ctx->prioridade,
            valorEstimado: $ctx->valorEstimado,
            observacoes: $ctx->observacoes,
            metadata: [
                'saga_id' => $ctx->sagaId,
                'step' => $this->name(),
            ],
        );

        $this->eventStore->saveAggregate($aggregate);
        $ctx->aggregate = $aggregate;
        $ctx->registrarEtapa($this->name());

        if (Schema::hasTable('ordens_servico')) {
            DB::table('ordens_servico')->updateOrInsert(
                ['codigo' => $ctx->ordemCodigo],
                [
                    'cliente' => $ctx->cliente,
                    'servico' => $ctx->servico,
                    'prioridade' => $aggregate->prioridade()->valor(),
                    'situacao' => $aggregate->status()->valor(),
                    'valor_estimado' => $aggregate->valorEstimado()->emReais(),
                    'observacoes' => $ctx->observacoes,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        return true;
    }

    public function compensate(SagaContext $ctx): void
    {
        if ($ctx->aggregate === null) {
            return;
        }

        $motivo = $ctx->motivoFalha ?? 'Compensação automática de Saga distribuída (Rollback Lógico)';
        $ctx->aggregate->cancelar(
            motivo: $motivo,
            origemCompensacaoSaga: true,
            metadata: [
                'saga_id' => $ctx->sagaId,
                'compensating_action' => $this->compensationName(),
            ],
        );

        $this->eventStore->saveAggregate($ctx->aggregate);
        $ctx->registrarCompensacao($this->compensationName());

        if (Schema::hasTable('ordens_servico')) {
            DB::table('ordens_servico')
                ->where('codigo', $ctx->ordemCodigo)
                ->update([
                    'situacao' => 'Cancelada',
                    'tecnico_id' => null,
                    'tecnico_nome' => null,
                    'observacoes' => '[SAGA ROLLBACK] ' . $motivo,
                    'updated_at' => now(),
                ]);
        }
    }
}
