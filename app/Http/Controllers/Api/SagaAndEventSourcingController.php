<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Core\Domain\ACL\LogisticaAclTranslator;
use App\Core\Domain\Events\OrdemServicoCriada;
use App\Core\Domain\Events\TecnicoAtribuido;
use App\Core\Infrastructure\EventStore\SqliteEventStore;
use App\Core\Saga\OrquestradorSagaAberturaOS;
use App\Core\Saga\SagaContext;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

final class SagaAndEventSourcingController extends Controller
{
    public function __construct(
        private readonly SqliteEventStore $eventStore,
        private readonly OrquestradorSagaAberturaOS $sagaOrchestrator,
        private readonly LogisticaAclTranslator $aclTranslator,
    ) {}

    public function executarSaga(Request $request): JsonResponse
    {
        $ordemCodigo = (string) $request->input('codigo', 'OS-' . random_int(2000, 9999));
        $cliente = (string) $request->input('cliente', 'Indústrias Metalúrgicas Votorantim S.A.');
        $servico = (string) $request->input('servico', 'Manutenção Preventiva de Subestação Elétrica 13.8kV');
        $prioridade = (string) $request->input('prioridade', 'Alta');
        $valorEstimado = (float) $request->input('valor_estimado', $request->input('valorEstimado', 2450.00));
        $tecnicoId = $request->has('tecnico_id') ? (int) $request->input('tecnico_id') : 1;
        $tecnicoNome = (string) $request->input('tecnico_nome', 'Carlos Eduardo Mendes');
        $tecnicoEspecialidade = (string) $request->input('tecnico_especialidade', 'Engenharia Elétrica & Alta Tensão');
        $observacoes = $request->input('observacoes') ? (string) $request->input('observacoes') : null;
        $simulateFailureAt = $request->input('simulate_failure_at', $request->input('simulateFailureAt'));

        $context = new SagaContext(
            ordemCodigo: $ordemCodigo,
            cliente: $cliente,
            servico: $servico,
            prioridade: $prioridade,
            valorEstimado: $valorEstimado,
            tecnicoId: $tecnicoId,
            tecnicoNome: $tecnicoNome,
            tecnicoEspecialidade: $tecnicoEspecialidade,
            observacoes: $observacoes,
            simulateFailureAt: is_string($simulateFailureAt) ? $simulateFailureAt : null,
            sagaId: 'SAGA-' . strtoupper(Str::random(8)),
        );

        $resultado = $this->sagaOrchestrator->executar($context);

        $statusCode = $resultado->sucesso ? 201 : 422;

        return response()->json([
            'sagaId' => $resultado->sagaId,
            'sucesso' => $resultado->sucesso,
            'statusSaga' => $resultado->statusSaga,
            'ordemCodigo' => $resultado->ordemCodigo,
            'etapasExecutadas' => $resultado->etapasExecutadas,
            'compensacoesExecutadas' => $resultado->compensacoesExecutadas,
            'estadoFinalAggregate' => $resultado->estadoFinalAggregate,
            'eventosRegistrados' => $resultado->eventosRegistrados,
            'motivoFalha' => $resultado->motivoFalha,
        ], $statusCode);
    }

    public function historicoEventos(string $aggregateId): JsonResponse
    {
        $eventos = $this->eventStore->getEventsForAggregate($aggregateId);

        if (empty($eventos)) {
            return response()->json([
                'encontrado' => false,
                'aggregateId' => $aggregateId,
                'mensagem' => sprintf('Nenhum evento encontrado no Event Store para o agregado "%s".', $aggregateId),
                'totalEventos' => 0,
                'streamEventos' => [],
                'estadoReconstituidoViaReplay' => null,
            ], 404);
        }

        try {
            $aggregate = $this->eventStore->loadAggregate($aggregateId);
            $estadoReconstituido = $aggregate->toArray();

            $aclDespachoDto = null;
            $primeiroEvento = $eventos[0] ?? null;
            if ($primeiroEvento !== null && ($primeiroEvento['event_type'] ?? '') === 'OrdemServicoCriada') {
                $eventoCriada = OrdemServicoCriada::fromStoredRecord(
                    aggregateId: $aggregateId,
                    payload: $primeiroEvento['payload'],
                    version: (int) $primeiroEvento['version'],
                    metadata: $primeiroEvento['metadata'],
                    eventId: $primeiroEvento['event_id'],
                );

                $eventoTecnico = null;
                foreach ($eventos as $ev) {
                    if (($ev['event_type'] ?? '') === 'TecnicoAtribuido') {
                        $eventoTecnico = TecnicoAtribuido::fromStoredRecord(
                            aggregateId: $aggregateId,
                            payload: $ev['payload'],
                            version: (int) $ev['version'],
                            metadata: $ev['metadata'],
                            eventId: $ev['event_id'],
                        );
                    }
                }

                $aclDespachoDto = $this->aclTranslator
                    ->traduzirParaDespacho($eventoCriada, $eventoTecnico)
                    ->toArray();
            }
        } catch (Throwable $exception) {
            return response()->json([
                'encontrado' => true,
                'aggregateId' => $aggregateId,
                'erroReplay' => $exception->getMessage(),
                'streamEventos' => $eventos,
            ], 500);
        }

        return response()->json([
            'encontrado' => true,
            'aggregateId' => $aggregateId,
            'aggregateType' => 'OrdemServicoAggregate',
            'versaoAtual' => $aggregate->version(),
            'totalEventos' => count($eventos),
            'streamEventos' => $eventos,
            'estadoReconstituidoViaReplay' => $estadoReconstituido,
            'traducaoAclLogisticaCampo' => $aclDespachoDto,
        ]);
    }

    public function executarSagaAbertura(Request $request): JsonResponse
    {
        return $this->executarSaga($request);
    }

    public function replayAggregate(string $aggregateId): JsonResponse
    {
        return $this->historicoEventos($aggregateId);
    }
}
