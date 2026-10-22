<?php

declare(strict_types=1);

namespace App\Core\Saga\Steps;

use App\Core\Infrastructure\EventStore\SqliteEventStore;
use App\Core\Saga\SagaContext;
use App\Core\Saga\SagaStepInterface;

final class ProcessarFaturamentoStep implements SagaStepInterface
{
    private const LIMITE_ORCAMENTO_AUTOMATICO = 50000.00;

    public function __construct(
        private readonly SqliteEventStore $eventStore,
    ) {}

    public function name(): string
    {
        return 'ProcessarFaturamentoStep';
    }

    public function compensationName(): string
    {
        return 'EstornarPreAutorizacaoFaturamentoCompensacao';
    }

    public function execute(SagaContext $ctx): bool
    {
        if ($ctx->simulateFailureAt === 'faturamento' || $ctx->valorEstimado > self::LIMITE_ORCAMENTO_AUTOMATICO) {
            $ctx->motivoFalha = sprintf(
                'Falha no faturamento: orçamento estimado (R$ %.2f) recusado ou excedeu limite de crédito automático.',
                $ctx->valorEstimado
            );
            return false;
        }

        if ($ctx->aggregate === null) {
            $ctx->motivoFalha = 'Agregado da Ordem de Serviço não encontrado para autorização financeira.';
            return false;
        }

        $codigoAutorizacao = 'AUTH-FIN-' . strtoupper(substr(md5($ctx->sagaId . $ctx->ordemCodigo), 0, 8));
        $ctx->codigoAutorizacaoFaturamento = $codigoAutorizacao;

        $ctx->aggregate->autorizarFaturamento(
            codigoAutorizacao: $codigoAutorizacao,
            valorAutorizado: $ctx->valorEstimado,
            metadata: [
                'saga_id' => $ctx->sagaId,
                'step' => $this->name(),
            ],
        );

        $this->eventStore->saveAggregate($ctx->aggregate);
        $ctx->registrarEtapa($this->name());

        return true;
    }

    public function compensate(SagaContext $ctx): void
    {
        $ctx->metadadosAuditoria['pre_autorizacao_estornada'] = $ctx->codigoAutorizacaoFaturamento;
        $ctx->codigoAutorizacaoFaturamento = null;
        $ctx->registrarCompensacao($this->compensationName());
    }
}
