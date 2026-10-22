<?php

declare(strict_types=1);

namespace App\Core\Domain\Aggregates;

use App\Core\Domain\Entities\ItemServicoEntity;
use App\Core\Domain\Events\DomainEventInterface;
use App\Core\Domain\Events\FaturamentoAutorizado;
use App\Core\Domain\Events\OrdemServicoCancelada;
use App\Core\Domain\Events\OrdemServicoConcluida;
use App\Core\Domain\Events\OrdemServicoCriada;
use App\Core\Domain\Events\TecnicoAtribuido;
use App\Core\Domain\ValueObjects\PrioridadeOrdem;
use App\Core\Domain\ValueObjects\StatusOrdem;
use App\Core\Domain\ValueObjects\ValorMonetario;
use DomainException;
use InvalidArgumentException;

final class OrdemServicoAggregate
{
    private string $codigo = '';
    private string $cliente = '';
    private string $servico = '';
    private PrioridadeOrdem $prioridade;
    private StatusOrdem $status;
    private ValorMonetario $valorEstimado;
    private ?ValorMonetario $valorFinal = null;
    private ?int $tecnicoId = null;
    private ?string $tecnicoNome = null;
    private ?string $tecnicoEspecialidade = null;
    private bool $faturamentoAutorizado = false;
    private ?string $codigoAutorizacaoFaturamento = null;
    private ?string $observacoes = null;
    private ?string $laudoTecnico = null;
    private ?string $motivoCancelamento = null;
    private int $version = 0;

    /** @var array<int, ItemServicoEntity> */
    private array $itens = [];

    /** @var array<int, DomainEventInterface> */
    private array $recordedEvents = [];

    private function __construct()
    {
        $this->prioridade = PrioridadeOrdem::media();
        $this->status = StatusOrdem::aberta();
        $this->valorEstimado = ValorMonetario::zero();
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public static function criar(
        string $codigo,
        string $cliente,
        string $servico,
        PrioridadeOrdem|string $prioridade,
        ValorMonetario|float|int $valorEstimado,
        ?string $observacoes = null,
        array $metadata = [],
    ): self {
        if (trim($codigo) === '' || trim($cliente) === '' || trim($servico) === '') {
            throw new InvalidArgumentException('Código, cliente e descrição do serviço são obrigatórios para abrir uma OS.');
        }

        $prioridadeVo = $prioridade instanceof PrioridadeOrdem
            ? $prioridade
            : PrioridadeOrdem::deString($prioridade);

        $valorVo = $valorEstimado instanceof ValorMonetario
            ? $valorEstimado
            : ValorMonetario::deReais($valorEstimado);

        $aggregate = new self();
        $evento = new OrdemServicoCriada(
            aggregateId: $codigo,
            cliente: $cliente,
            servico: $servico,
            prioridade: $prioridadeVo->valor(),
            valorEstimadoReais: $valorVo->emReais(),
            valorEstimadoCentavos: $valorVo->emCentavos(),
            slaHoras: $prioridadeVo->slaHoras(),
            observacoes: $observacoes,
            version: 1,
            metadata: $metadata,
        );

        $aggregate->recordAndApply($evento);

        return $aggregate;
    }

    /**
     * @param iterable<DomainEventInterface|array<string, mixed>|object> $eventos
     */
    public static function reconstituirDeEventos(iterable $eventos): self
    {
        $aggregate = new self();
        $count = 0;

        foreach ($eventos as $evento) {
            $domainEvent = self::hidratarEvento($evento);
            $aggregate->apply($domainEvent);
            $count++;
        }

        if ($count === 0) {
            throw new DomainException('Não é possível reconstituir OrdemServicoAggregate a partir de um stream de eventos vazio.');
        }

        return $aggregate;
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function atribuirTecnico(
        int $tecnicoId,
        string $tecnicoNome,
        string $especialidade = 'Geral',
        string $novaSituacao = StatusOrdem::AGENDADA,
        array $metadata = [],
    ): void {
        if ($this->status->ehTerminal()) {
            throw new DomainException(
                sprintf('Não é permitido atribuir técnico a uma Ordem de Serviço em estado terminal (%s).', $this->status->valor())
            );
        }

        $novoStatus = StatusOrdem::deString($novaSituacao);
        if (!$this->status->podeTransicionarPara($novoStatus)) {
            throw new DomainException(
                sprintf('Transição inválida ao atribuir técnico: de "%s" para "%s".', $this->status->valor(), $novoStatus->valor())
            );
        }

        $evento = new TecnicoAtribuido(
            aggregateId: $this->codigo,
            tecnicoId: $tecnicoId,
            tecnicoNome: $tecnicoNome,
            especialidade: $especialidade,
            novaSituacao: $novoStatus->valor(),
            version: $this->version + 1,
            metadata: $metadata,
        );

        $this->recordAndApply($evento);
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function autorizarFaturamento(
        string $codigoAutorizacao,
        ValorMonetario|float|int|null $valorAutorizado = null,
        array $metadata = [],
    ): void {
        if ($this->status->ehTerminal()) {
            throw new DomainException('Não é permitido autorizar faturamento para OS concluída ou cancelada.');
        }

        $valorVo = match (true) {
            $valorAutorizado instanceof ValorMonetario => $valorAutorizado,
            $valorAutorizado !== null => ValorMonetario::deReais($valorAutorizado),
            default => $this->valorEstimado,
        };

        $evento = new FaturamentoAutorizado(
            aggregateId: $this->codigo,
            codigoAutorizacao: $codigoAutorizacao,
            valorAutorizadoReais: $valorVo->emReais(),
            valorAutorizadoCentavos: $valorVo->emCentavos(),
            version: $this->version + 1,
            metadata: $metadata,
        );

        $this->recordAndApply($evento);
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function concluir(
        ValorMonetario|float|int|null $valorFinal = null,
        ?string $laudoTecnico = null,
        array $metadata = [],
    ): void {
        $destino = StatusOrdem::concluida();
        if (!$this->status->podeTransicionarPara($destino)) {
            throw new DomainException(
                sprintf('Não é possível concluir OS a partir do estado "%s".', $this->status->valor())
            );
        }

        $valorVo = match (true) {
            $valorFinal instanceof ValorMonetario => $valorFinal,
            $valorFinal !== null => ValorMonetario::deReais($valorFinal),
            default => $this->valorEstimado,
        };

        $evento = new OrdemServicoConcluida(
            aggregateId: $this->codigo,
            valorFinalReais: $valorVo->emReais(),
            valorFinalCentavos: $valorVo->emCentavos(),
            laudoTecnico: $laudoTecnico,
            version: $this->version + 1,
            metadata: $metadata,
        );

        $this->recordAndApply($evento);
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function cancelar(
        string $motivo,
        bool $origemCompensacaoSaga = false,
        array $metadata = [],
    ): void {
        if ($this->status->igualA(StatusOrdem::concluida())) {
            throw new DomainException('Não é permitido cancelar uma Ordem de Serviço já concluída.');
        }

        if ($this->status->igualA(StatusOrdem::cancelada())) {
            return;
        }

        $evento = new OrdemServicoCancelada(
            aggregateId: $this->codigo,
            motivoCancelamento: $motivo,
            origemCompensacaoSaga: $origemCompensacaoSaga,
            version: $this->version + 1,
            metadata: $metadata,
        );

        $this->recordAndApply($evento);
    }

    public function adicionarItem(ItemServicoEntity $item): void
    {
        if ($this->status->ehTerminal()) {
            throw new DomainException('Não é possível adicionar itens a uma OS finalizada ou cancelada.');
        }

        $this->itens[] = $item;
    }

    /**
     * @return array<int, DomainEventInterface>
     */
    public function pullDomainEvents(): array
    {
        $events = $this->recordedEvents;
        $this->recordedEvents = [];

        return $events;
    }

    /**
     * @return array<int, DomainEventInterface>
     */
    public function recordedDomainEvents(): array
    {
        return $this->recordedEvents;
    }

    public function codigo(): string
    {
        return $this->codigo;
    }

    public function cliente(): string
    {
        return $this->cliente;
    }

    public function servico(): string
    {
        return $this->servico;
    }

    public function prioridade(): PrioridadeOrdem
    {
        return $this->prioridade;
    }

    public function status(): StatusOrdem
    {
        return $this->status;
    }

    public function valorEstimado(): ValorMonetario
    {
        return $this->valorEstimado;
    }

    public function valorFinal(): ?ValorMonetario
    {
        return $this->valorFinal;
    }

    public function tecnicoId(): ?int
    {
        return $this->tecnicoId;
    }

    public function tecnicoNome(): ?string
    {
        return $this->tecnicoNome;
    }

    public function tecnicoEspecialidade(): ?string
    {
        return $this->tecnicoEspecialidade;
    }

    public function faturamentoAutorizado(): bool
    {
        return $this->faturamentoAutorizado;
    }

    public function codigoAutorizacaoFaturamento(): ?string
    {
        return $this->codigoAutorizacaoFaturamento;
    }

    public function observacoes(): ?string
    {
        return $this->observacoes;
    }

    public function laudoTecnico(): ?string
    {
        return $this->laudoTecnico;
    }

    public function motivoCancelamento(): ?string
    {
        return $this->motivoCancelamento;
    }

    public function version(): int
    {
        return $this->version;
    }

    /**
     * @return array<int, ItemServicoEntity>
     */
    public function itens(): array
    {
        return $this->itens;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'codigo' => $this->codigo,
            'cliente' => $this->cliente,
            'servico' => $this->servico,
            'prioridade' => $this->prioridade->valor(),
            'sla_horas' => $this->prioridade->slaHoras(),
            'situacao' => $this->status->valor(),
            'valor_estimado' => $this->valorEstimado->emReais(),
            'valor_estimado_formatado' => $this->valorEstimado->formatar(),
            'valor_final' => $this->valorFinal?->emReais(),
            'valor_final_formatado' => $this->valorFinal?->formatar(),
            'tecnico_id' => $this->tecnicoId,
            'tecnico_nome' => $this->tecnicoNome,
            'tecnico_especialidade' => $this->tecnicoEspecialidade,
            'faturamento_autorizado' => $this->faturamentoAutorizado,
            'codigo_autorizacao_faturamento' => $this->codigoAutorizacaoFaturamento,
            'observacoes' => $this->observacoes,
            'laudo_tecnico' => $this->laudoTecnico,
            'motivo_cancelamento' => $this->motivoCancelamento,
            'version' => $this->version,
            'itens' => array_map(static fn (ItemServicoEntity $item) => $item->toArray(), $this->itens),
        ];
    }

    private function recordAndApply(DomainEventInterface $evento): void
    {
        $this->apply($evento);
        $this->recordedEvents[] = $evento;
    }

    private function apply(DomainEventInterface $evento): void
    {
        match ($evento->eventType()) {
            'OrdemServicoCriada' => $this->applyOrdemServicoCriada($evento),
            'TecnicoAtribuido' => $this->applyTecnicoAtribuido($evento),
            'FaturamentoAutorizado' => $this->applyFaturamentoAutorizado($evento),
            'OrdemServicoConcluida' => $this->applyOrdemServicoConcluida($evento),
            'OrdemServicoCancelada' => $this->applyOrdemServicoCancelada($evento),
            default => null,
        };

        $this->version = $evento->version();
    }

    private function applyOrdemServicoCriada(DomainEventInterface $evento): void
    {
        $payload = $evento->payload();
        $this->codigo = $evento->aggregateId();
        $this->cliente = (string) ($payload['cliente'] ?? '');
        $this->servico = (string) ($payload['servico'] ?? '');
        $this->prioridade = PrioridadeOrdem::deString((string) ($payload['prioridade'] ?? PrioridadeOrdem::MEDIA));
        $this->status = StatusOrdem::deString((string) ($payload['situacao'] ?? StatusOrdem::ABERTA));
        $this->valorEstimado = isset($payload['valor_estimado_centavos'])
            ? ValorMonetario::deCentavos((int) $payload['valor_estimado_centavos'])
            : ValorMonetario::deReais((float) ($payload['valor_estimado_reais'] ?? 0.0));
        $this->observacoes = isset($payload['observacoes']) ? (string) $payload['observacoes'] : null;
    }

    private function applyTecnicoAtribuido(DomainEventInterface $evento): void
    {
        $payload = $evento->payload();
        $this->tecnicoId = isset($payload['tecnico_id']) ? (int) $payload['tecnico_id'] : null;
        $this->tecnicoNome = isset($payload['tecnico_nome']) ? (string) $payload['tecnico_nome'] : null;
        $this->tecnicoEspecialidade = isset($payload['especialidade']) ? (string) $payload['especialidade'] : 'Geral';
        $novaSituacao = (string) ($payload['situacao'] ?? StatusOrdem::AGENDADA);
        $this->status = $this->status->transicionarPara(StatusOrdem::deString($novaSituacao));
    }

    private function applyFaturamentoAutorizado(DomainEventInterface $evento): void
    {
        $payload = $evento->payload();
        $this->faturamentoAutorizado = (bool) ($payload['faturamento_autorizado'] ?? true);
        $this->codigoAutorizacaoFaturamento = (string) ($payload['codigo_autorizacao'] ?? '');
    }

    private function applyOrdemServicoConcluida(DomainEventInterface $evento): void
    {
        $payload = $evento->payload();
        $this->status = $this->status->transicionarPara(StatusOrdem::concluida());
        $this->valorFinal = isset($payload['valor_final_centavos'])
            ? ValorMonetario::deCentavos((int) $payload['valor_final_centavos'])
            : ValorMonetario::deReais((float) ($payload['valor_final_reais'] ?? $this->valorEstimado->emReais()));
        $this->laudoTecnico = isset($payload['laudo_tecnico']) ? (string) $payload['laudo_tecnico'] : null;
    }

    private function applyOrdemServicoCancelada(DomainEventInterface $evento): void
    {
        $payload = $evento->payload();
        $this->status = StatusOrdem::cancelada();
        $this->motivoCancelamento = (string) ($payload['motivo_cancelamento'] ?? 'Cancelamento operacional');
    }

    /**
     * @param DomainEventInterface|array<string, mixed>|object $raw
     */
    private static function hidratarEvento(array|object $raw): DomainEventInterface
    {
        if ($raw instanceof DomainEventInterface) {
            return $raw;
        }

        $data = is_array($raw) ? $raw : (array) $raw;
        $aggregateId = (string) ($data['aggregate_id'] ?? '');
        $eventType = (string) ($data['event_type'] ?? '');
        $version = (int) ($data['version'] ?? 1);
        $eventId = isset($data['event_id']) ? (string) $data['event_id'] : null;

        $payload = $data['payload'] ?? [];
        if (is_string($payload)) {
            $decoded = json_decode($payload, true);
            $payload = is_array($decoded) ? $decoded : [];
        }

        $metadata = $data['metadata'] ?? [];
        if (is_string($metadata)) {
            $decodedMeta = json_decode($metadata, true);
            $metadata = is_array($decodedMeta) ? $decodedMeta : [];
        }

        $occurredOn = isset($data['created_at']) && is_string($data['created_at'])
            ? new \DateTimeImmutable($data['created_at'])
            : new \DateTimeImmutable('now');

        return match ($eventType) {
            'OrdemServicoCriada' => OrdemServicoCriada::fromStoredRecord($aggregateId, $payload, $version, $metadata, $eventId, $occurredOn),
            'TecnicoAtribuido' => TecnicoAtribuido::fromStoredRecord($aggregateId, $payload, $version, $metadata, $eventId, $occurredOn),
            'FaturamentoAutorizado' => FaturamentoAutorizado::fromStoredRecord($aggregateId, $payload, $version, $metadata, $eventId, $occurredOn),
            'OrdemServicoConcluida' => OrdemServicoConcluida::fromStoredRecord($aggregateId, $payload, $version, $metadata, $eventId, $occurredOn),
            'OrdemServicoCancelada' => OrdemServicoCancelada::fromStoredRecord($aggregateId, $payload, $version, $metadata, $eventId, $occurredOn),
            default => throw new DomainException(sprintf('Tipo de evento desconhecido no Event Store: %s', $eventType)),
        };
    }
}
