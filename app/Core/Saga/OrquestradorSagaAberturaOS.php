<?php

declare(strict_types=1);

namespace App\Core\Saga;

use App\Core\Infrastructure\EventStore\SqliteEventStore;
use App\Core\Saga\Steps\AlocarTecnicoStep;
use App\Core\Saga\Steps\ConfirmarOrdemStep;
use App\Core\Saga\Steps\CriarOrdemStep;
use App\Core\Saga\Steps\ProcessarFaturamentoStep;
use Throwable;

/**
 * Orquestrador Central da Saga de Abertura de Ordem de Serviço (Slide 37-41 - ASC14).
 *
 * Coordena transações locais encadeadas entre os Bounded Contexts:
 * 1. Ordens de Serviço (CriarOrdemStep)
 * 2. Logística de Campo (AlocarTecnicoStep)
 * 3. Faturamento Financeiro (ProcessarFaturamentoStep)
 * 4. Confirmação Operacional (ConfirmarOrdemStep)
 *
 * Em caso de falha em qualquer etapa, executa compensações (rollback lógico)
 * na ordem estritamente inversa das etapas que tiveram sucesso.
 */
final class OrquestradorSagaAberturaOS
{
    /** @var array<int, SagaStepInterface> */
    private array $steps;

    /**
     * @param array<int, SagaStepInterface>|null $steps
     */
    public function __construct(
        private readonly SqliteEventStore $eventStore,
        ?array $steps = null,
    ) {
        $this->steps = $steps ?? [
            new CriarOrdemStep($this->eventStore),
            new AlocarTecnicoStep($this->eventStore),
            new ProcessarFaturamentoStep($this->eventStore),
            new ConfirmarOrdemStep($this->eventStore),
        ];
    }

    public function executar(SagaContext $context): SagaResult
    {
        /** @var array<int, SagaStepInterface> $succeededSteps */
        $succeededSteps = [];

        foreach ($this->steps as $step) {
            try {
                $ok = $step->execute($context);
            } catch (Throwable $exception) {
                $context->motivoFalha = $exception->getMessage();
                $ok = false;
            }

            if (!$ok) {
                $this->executarCompensacoesReversas($succeededSteps, $context);
                return $this->construirResultado($context, false, 'COMPENSADA_POR_FALHA');
            }

            $succeededSteps[] = $step;
        }

        return $this->construirResultado($context, true, 'CONCLUIDA_COM_SUCESSO');
    }

    /**
     * @param array<int, SagaStepInterface> $succeededSteps
     */
    private function executarCompensacoesReversas(array $succeededSteps, SagaContext $context): void
    {
        $reversed = array_reverse($succeededSteps);
        foreach ($reversed as $step) {
            $step->compensate($context);
        }
    }

    private function construirResultado(SagaContext $context, bool $sucesso, string $statusSaga): SagaResult
    {
        $eventos = $this->eventStore->getEventsForAggregate($context->ordemCodigo);
        $estadoFinal = [];

        if (!empty($eventos)) {
            $reconstruido = $this->eventStore->loadAggregate($context->ordemCodigo);
            $estadoFinal = $reconstruido->toArray();
        } elseif ($context->aggregate !== null) {
            $estadoFinal = $context->aggregate->toArray();
        }

        return new SagaResult(
            sagaId: $context->sagaId,
            sucesso: $sucesso,
            statusSaga: $statusSaga,
            ordemCodigo: $context->ordemCodigo,
            etapasExecutadas: $context->etapasExecutadas,
            compensacoesExecutadas: $context->compensacoesExecutadas,
            estadoFinalAggregate: $estadoFinal,
            eventosRegistrados: $eventos,
            motivoFalha: $context->motivoFalha,
        );
    }
}
