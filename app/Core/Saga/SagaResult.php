<?php

declare(strict_types=1);

namespace App\Core\Saga;

final readonly class SagaResult
{
    /**
     * @param array<int, string> $etapasExecutadas
     * @param array<int, string> $compensacoesExecutadas
     * @param array<string, mixed> $estadoFinalAggregate
     * @param array<int, array<string, mixed>> $eventosRegistrados
     */
    public function __construct(
        public string $sagaId,
        public bool $sucesso,
        public string $statusSaga,
        public string $ordemCodigo,
        public array $etapasExecutadas,
        public array $compensacoesExecutadas,
        public array $estadoFinalAggregate,
        public array $eventosRegistrados = [],
        public ?string $motivoFalha = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'sagaId' => $this->sagaId,
            'sucesso' => $this->sucesso,
            'statusSaga' => $this->statusSaga,
            'ordemCodigo' => $this->ordemCodigo,
            'etapasExecutadas' => $this->etapasExecutadas,
            'compensacoesExecutadas' => $this->compensacoesExecutadas,
            'estadoFinalAggregate' => $this->estadoFinalAggregate,
            'eventosRegistrados' => $this->eventosRegistrados,
            'motivoFalha' => $this->motivoFalha,
        ];
    }
}
