<?php

declare(strict_types=1);

namespace App\Core\Saga\Steps;

use App\Core\Domain\ValueObjects\StatusOrdem;
use App\Core\Infrastructure\EventStore\SqliteEventStore;
use App\Core\Saga\SagaContext;
use App\Core\Saga\SagaStepInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class ConfirmarOrdemStep implements SagaStepInterface
{
    public function __construct(
        private readonly SqliteEventStore $eventStore,
    ) {}

    public function name(): string
    {
        return 'ConfirmarOrdemStep';
    }

    public function compensationName(): string
    {
        return 'ReverterConfirmacaoOrdemCompensacao';
    }

    public function execute(SagaContext $ctx): bool
    {
        if ($ctx->simulateFailureAt === 'confirmacao' || $ctx->aggregate === null) {
            $ctx->motivoFalha = 'Falha na etapa final de confirmação do despacho operacional.';
            return false;
        }

        if ($ctx->tecnicoId !== null && $ctx->aggregate->status()->valor() === StatusOrdem::AGENDADA) {
            $ctx->aggregate->atribuirTecnico(
                tecnicoId: $ctx->tecnicoId,
                tecnicoNome: $ctx->tecnicoNome,
                especialidade: $ctx->tecnicoEspecialidade,
                novaSituacao: StatusOrdem::EM_EXECUCAO,
                metadata: [
                    'saga_id' => $ctx->sagaId,
                    'step' => $this->name(),
                ],
            );

            $this->eventStore->saveAggregate($ctx->aggregate);
        }

        $ctx->registrarEtapa($this->name());

        if (Schema::hasTable('ordens_servico')) {
            DB::table('ordens_servico')
                ->where('codigo', $ctx->ordemCodigo)
                ->update([
                    'situacao' => $ctx->aggregate->status()->valor(),
                    'updated_at' => now(),
                ]);
        }

        return true;
    }

    public function compensate(SagaContext $ctx): void
    {
        $ctx->registrarCompensacao($this->compensationName());
    }
}
