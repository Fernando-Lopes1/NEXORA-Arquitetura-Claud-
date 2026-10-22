<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Core\Infrastructure\EventStore\SqliteEventStore;
use App\Core\Saga\OrquestradorSagaAberturaOS;
use App\Core\Saga\SagaContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class SagaPatternTest extends TestCase
{
    use RefreshDatabase;

    public function test_saga_happy_path_executes_all_four_steps_and_persists_events(): void
    {
        $eventStore = new SqliteEventStore();
        $orchestrator = new OrquestradorSagaAberturaOS($eventStore);

        $context = new SagaContext(
            ordemCodigo: 'OS-9001',
            cliente: 'Petrobras Refinaria RPBC',
            servico: 'Inspeção Termográfica em Painel de Comando',
            prioridade: 'Alta',
            valorEstimado: 4800.00,
            tecnicoId: 1,
            tecnicoNome: 'Carlos Eduardo Mendes',
            tecnicoEspecialidade: 'Termografia Industrial',
            observacoes: 'Abertura via Orquestrador de Saga',
        );

        $resultado = $orchestrator->executar($context);

        $this->assertTrue($resultado->sucesso);
        $this->assertSame('CONCLUIDA_COM_SUCESSO', $resultado->statusSaga);
        $this->assertSame([
            'CriarOrdemStep',
            'AlocarTecnicoStep',
            'ProcessarFaturamentoStep',
            'ConfirmarOrdemStep',
        ], $resultado->etapasExecutadas);
        $this->assertEmpty($resultado->compensacoesExecutadas);
        $this->assertSame('Em execução', $resultado->estadoFinalAggregate['situacao']);
        $this->assertTrue($resultado->estadoFinalAggregate['faturamento_autorizado']);
        $this->assertCount(4, $resultado->eventosRegistrados);
    }

    public function test_saga_failure_at_faturamento_triggers_reverse_compensating_transactions(): void
    {
        $eventStore = new SqliteEventStore();
        $orchestrator = new OrquestradorSagaAberturaOS($eventStore);

        $context = new SagaContext(
            ordemCodigo: 'OS-9002',
            cliente: 'Companhia Siderúrgica Nacional',
            servico: 'Retrofit Completo de Subestação Blindada',
            prioridade: 'Urgente',
            valorEstimado: 85000.00, // Excede o limite automático de R$ 50.000,00 no ProcessarFaturamentoStep
            tecnicoId: 2,
            tecnicoNome: 'Roberto Almeida',
            tecnicoEspecialidade: 'Alta Tensão',
            simulateFailureAt: 'faturamento',
        );

        $resultado = $orchestrator->executar($context);

        $this->assertFalse($resultado->sucesso);
        $this->assertSame('COMPENSADA_POR_FALHA', $resultado->statusSaga);
        $this->assertSame([
            'CriarOrdemStep',
            'AlocarTecnicoStep',
        ], $resultado->etapasExecutadas);

        // Compensações executadas na ordem estritamente inversa (Step 2 -> Step 1)
        $this->assertSame([
            'LiberarReservaTecnicoCompensacao',
            'CancelarOrdemCompensacao',
        ], $resultado->compensacoesExecutadas);

        // O estado final reconstituído via Event Store deve refletir o evento de compensação (Cancelada)
        $this->assertSame('Cancelada', $resultado->estadoFinalAggregate['situacao']);
        $this->assertCount(3, $resultado->eventosRegistrados);
        $this->assertSame('OrdemServicoCancelada', $resultado->eventosRegistrados[2]['event_type']);
        $this->assertTrue($resultado->eventosRegistrados[2]['payload']['origem_compensacao_saga']);
    }

    public function test_api_endpoints_for_saga_execution_and_event_store_replay(): void
    {
        // 1. Executa Saga com sucesso via API
        $responseSuccess = $this->postJson('/api/saga/ordens', [
            'codigo' => 'OS-9100',
            'cliente' => 'Vale Logística Ferroviária',
            'servico' => 'Calibração de Sensores de Via Permanente',
            'prioridade' => 'Alta',
            'valor_estimado' => 3200.00,
            'tecnico_id' => 1,
            'tecnico_nome' => 'Carlos Eduardo Mendes',
        ]);

        $responseSuccess->assertStatus(201)
            ->assertJsonPath('sucesso', true)
            ->assertJsonPath('ordemCodigo', 'OS-9100')
            ->assertJsonPath('estadoFinalAggregate.situacao', 'Em execução');

        // 2. Consulta o Event Store e verifica o Replay + ACL via API
        $responseReplay = $this->getJson('/api/event-store/OS-9100');

        $responseReplay->assertStatus(200)
            ->assertJsonPath('encontrado', true)
            ->assertJsonPath('aggregateId', 'OS-9100')
            ->assertJsonPath('versaoAtual', 4)
            ->assertJsonPath('estadoReconstituidoViaReplay.situacao', 'Em execução')
            ->assertJsonPath('traducaoAclLogisticaCampo.codigo_despacho_externo', 'DSP-OS-9100')
            ->assertJsonPath('traducaoAclLogisticaCampo.nivel_criticidade_logistica', 'ALTA_PRIORIDADE_P2');

        // 3. Executa Saga com falha simulada na alocação de técnico
        $responseRollback = $this->postJson('/api/saga/ordens', [
            'codigo' => 'OS-9101',
            'cliente' => 'Ambev Cervejaria Jaguariúna',
            'servico' => 'Manutenção de Caldeira Industrial',
            'prioridade' => 'Urgente',
            'valor_estimado' => 2900.00,
            'simulate_failure_at' => 'alocacao',
        ]);

        $responseRollback->assertStatus(422)
            ->assertJsonPath('sucesso', false)
            ->assertJsonPath('statusSaga', 'COMPENSADA_POR_FALHA')
            ->assertJsonPath('compensacoesExecutadas.0', 'CancelarOrdemCompensacao')
            ->assertJsonPath('estadoFinalAggregate.situacao', 'Cancelada');
    }
}
