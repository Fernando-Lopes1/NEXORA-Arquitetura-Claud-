<?php

declare(strict_types=1);

namespace App\Core\Saga;

use App\Core\Domain\Aggregates\OrdemServicoAggregate;
use Illuminate\Support\Str;

final class SagaContext
{
    public string $sagaId;
    public ?OrdemServicoAggregate $aggregate = null;
    public ?string $codigoAutorizacaoFaturamento = null;
    public bool $tecnicoReservado = false;
    public ?string $motivoFalha = null;

    /** @var array<int, string> */
    public array $etapasExecutadas = [];

    /** @var array<int, string> */
    public array $compensacoesExecutadas = [];

    /** @var array<string, mixed> */
    public array $metadadosAuditoria = [];

    public function __construct(
        public string $ordemCodigo,
        public string $cliente,
        public string $servico,
        public string $prioridade = 'Alta',
        public float $valorEstimado = 1500.00,
        public ?int $tecnicoId = 1,
        public string $tecnicoNome = 'Carlos Eduardo Mendes',
        public string $tecnicoEspecialidade = 'Infraestrutura & Redes',
        public ?string $observacoes = null,
        public ?string $simulateFailureAt = null,
        ?string $sagaId = null,
    ) {
        $this->sagaId = $sagaId ?? ('SAGA-' . strtoupper(Str::random(8)));
    }

    public function registrarEtapa(string $nomeEtapa): void
    {
        $this->etapasExecutadas[] = $nomeEtapa;
    }

    public function registrarCompensacao(string $nomeCompensacao): void
    {
        $this->compensacoesExecutadas[] = $nomeCompensacao;
    }
}
