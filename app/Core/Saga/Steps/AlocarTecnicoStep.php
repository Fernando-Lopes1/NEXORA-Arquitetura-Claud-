<?php

declare(strict_types=1);

namespace App\Core\Saga\Steps;

use App\Core\Domain\ValueObjects\StatusOrdem;
use App\Core\Infrastructure\EventStore\SqliteEventStore;
use App\Core\Saga\SagaContext;
use App\Core\Saga\SagaStepInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class AlocarTecnicoStep implements SagaStepInterface
{
    public function __construct(
        private readonly SqliteEventStore $eventStore,
    ) {}

    public function name(): string
    {
        return 'AlocarTecnicoStep';
    }

    public function compensationName(): string
    {
        return 'LiberarReservaTecnicoCompensacao';
    }

    public function execute(SagaContext $ctx): bool
    {
        if ($ctx->simulateFailureAt === 'alocacao' || $ctx->tecnicoId === null || $ctx->tecnicoId <= 0) {
            $ctx->motivoFalha = 'Falha na alocação de técnico: especialista indisponível na agenda de campo.';
            return false;
        }

        if ($ctx->aggregate === null) {
            $ctx->motivoFalha = 'Agregado da Ordem de Serviço não inicializado antes da alocação.';
            return false;
        }

        $ctx->aggregate->atribuirTecnico(
            tecnicoId: $ctx->tecnicoId,
            tecnicoNome: $ctx->tecnicoNome,
            especialidade: $ctx->tecnicoEspecialidade,
            novaSituacao: StatusOrdem::AGENDADA,
            metadata: [
                'saga_id' => $ctx->sagaId,
                'step' => $this->name(),
            ],
        );

        $this->eventStore->saveAggregate($ctx->aggregate);
        $ctx->tecnicoReservado = true;
        $ctx->registrarEtapa($this->name());

        if (Schema::hasTable('ordens_servico')) {
            DB::table('ordens_servico')
                ->where('codigo', $ctx->ordemCodigo)
                ->update([
                    'tecnico_nome' => $ctx->tecnicoNome,
                    'situacao' => StatusOrdem::AGENDADA,
                    'data_agendamento' => now(),
                    'updated_at' => now(),
                ]);
        }

        return true;
    }

    public function compensate(SagaContext $ctx): void
    {
        $ctx->tecnicoReservado = false;
        $ctx->metadadosAuditoria['reserva_tecnico_liberada'] = [
            'tecnico_id' => $ctx->tecnicoId,
            'tecnico_nome' => $ctx->tecnicoNome,
            'liberado_em' => now()->toIso8601String(),
        ];

        $ctx->registrarCompensacao($this->compensationName());
    }
}
