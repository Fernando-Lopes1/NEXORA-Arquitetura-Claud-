<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Core\Application\Commands\AtribuirTecnicoCommand;
use App\Core\Application\Commands\ConcluirOrdemServicoCommand;
use App\Core\Application\Commands\CriarOrdemServicoCommand;
use App\Core\Application\Contracts\CommandBusInterface;
use App\Core\Application\Contracts\QueryBusInterface;
use App\Core\Application\Queries\ListarOrdensQuery;
use App\Core\Application\Queries\ObterDashboardKpisQuery;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MvcAndCqrsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_cqrs_command_and_query_buses_execute_write_and_read_operations(): void
    {
        /** @var CommandBusInterface $commandBus */
        $commandBus = $this->app->make(CommandBusInterface::class);
        /** @var QueryBusInterface $queryBus */
        $queryBus = $this->app->make(QueryBusInterface::class);

        $created = $commandBus->dispatch(new CriarOrdemServicoCommand(
            cliente: 'DataCenter Brasil Sul',
            servico: 'Substituição de nobreak redundante',
            prioridade: 'Urgente',
            situacao: 'Aberta',
            valorEstimado: 3200.00,
            codigo: 'OS-2001'
        ));

        $this->assertSame('OS-2001', $created->codigo);

        $assigned = $commandBus->dispatch(new AtribuirTecnicoCommand(
            ordemIdOuCodigo: 'OS-2001',
            tecnicoNome: 'Éden Samuel'
        ));
        $this->assertSame('Éden Samuel', $assigned->tecnico_nome);
        $this->assertSame('Agendada', $assigned->situacao);

        $completed = $commandBus->dispatch(new ConcluirOrdemServicoCommand(
            ordemIdOuCodigo: 'OS-2001',
            valorFinal: 3500.00
        ));
        $this->assertSame('Concluída', $completed->situacao);

        $ordens = $queryBus->ask(new ListarOrdensQuery(busca: 'DataCenter'));
        $this->assertCount(1, $ordens);

        $kpis = $queryBus->ask(new ObterDashboardKpisQuery());
        $this->assertGreaterThanOrEqual(6, $kpis['totalOrders']);
        $this->assertArrayHasKey('completionRate', $kpis);
        $this->assertArrayHasKey('technicianWorkload', $kpis);
    }

    public function test_mvc_ordens_index_and_creation_flow(): void
    {
        $response = $this->get('/ordens');
        $response->assertStatus(200);
        $response->assertSee('Hospital Central São Lucas');
        $response->assertSee('OS-1001');

        $postResponse = $this->post('/ordens', [
            'cliente' => 'Indústria Metalúrgica ABC',
            'servico' => 'Calibração de painel CLP Siemens',
            'prioridade' => 'Alta',
            'situacao' => 'Aberta',
            'valor_estimado' => 1500.00,
        ]);

        $postResponse->assertRedirect(route('ordens.index'));
        $this->assertDatabaseHas('ordens_servico', [
            'cliente' => 'Indústria Metalúrgica ABC',
            'prioridade' => 'Alta',
        ]);
    }

    public function test_mvc_complete_order_and_dashboard_view(): void
    {
        $patchResponse = $this->patch('/ordens/OS-1001/concluir', [
            'valor_final' => 1850.00,
        ]);
        $patchResponse->assertRedirect();

        $this->assertDatabaseHas('ordens_servico', [
            'codigo' => 'OS-1001',
            'situacao' => 'Concluída',
        ]);

        $dashboardResponse = $this->get('/dashboard');
        $dashboardResponse->assertStatus(200);
        $dashboardResponse->assertSee('Painel de Indicadores & Performance (KPIs)');
        $dashboardResponse->assertSee('Henrique Ricardo');
    }
}
