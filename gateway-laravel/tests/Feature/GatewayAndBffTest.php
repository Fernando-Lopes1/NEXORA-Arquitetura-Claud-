<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GatewayAndBffTest extends TestCase
{
    /**
     * Testa o Health Check e a injeção de headers de telemetria do Gateway.
     */
    public function test_health_check_returns_success_and_gateway_headers(): void
    {
        $response = $this->get('/api/health');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'UP',
            'gateway' => 'NEXORA-Laravel-API-Gateway',
        ]);

        $response->assertHeader('X-Correlation-Id');
        $response->assertHeader('X-Gateway-Processed-By', 'NEXORA-Laravel-API-Gateway');
        $response->assertHeader('X-Gateway-Execution-Time-Ms');
        $response->assertHeader('X-Gateway-Route', 'health');
    }

    /**
     * Testa o status da topologia do Gateway.
     */
    public function test_bff_status_endpoint_returns_topology(): void
    {
        $response = $this->get('/api/bff/status');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'projeto',
            'versao',
            'tecnologia' => ['linguagem', 'framework', 'padroes'],
            'topologia' => ['servicos_downstream'],
            'rotas_principais',
        ]);
        $response->assertHeader('X-Gateway-Route', 'bff-status');
    }

    /**
     * Testa a agregação concorrente do BFF Dashboard com Http::fake.
     */
    public function test_bff_dashboard_aggregates_parallel_responses(): void
    {
        $osUrl = config('services.os.url');
        $tecnicosUrl = config('services.tecnicos.url');

        Http::fake([
            "{$osUrl}/api/ordens*" => Http::response([
                ['id' => 1, 'titulo' => 'OS Teste 1', 'status' => 'Aberta', 'prioridade' => 'Alta', 'valor_total' => 150.0],
                ['id' => 2, 'titulo' => 'OS Teste 2', 'status' => 'Concluída', 'prioridade' => 'Média', 'valor_total' => 300.0],
            ], 200),
            "{$tecnicosUrl}/api/tecnicos*" => Http::response([
                ['id' => 10, 'nome' => 'Carlos Silva', 'especialidade' => 'Redes', 'ativo' => true, 'disponivel' => true],
            ], 200),
        ]);

        $response = $this->get('/api/bff/dashboard');

        $response->assertStatus(200);
        $response->assertJsonPath('resumo_kpis.total_ordens', 2);
        $response->assertJsonPath('resumo_kpis.total_tecnicos', 1);
        $response->assertJsonPath('resumo_kpis.tecnicos_disponiveis', 1);
        $response->assertJsonPath('status_microsservicos.os_service.status', 'ONLINE');
        $response->assertJsonPath('status_microsservicos.tecnicos_service.status', 'ONLINE');
        $response->assertHeader('X-Gateway-Route', 'bff-dashboard');
    }

    /**
     * Testa a Composição de Entidades (ordens com técnicos).
     */
    public function test_bff_service_composition_enriches_orders_with_technicians(): void
    {
        $osUrl = config('services.os.url');
        $tecnicosUrl = config('services.tecnicos.url');

        Http::fake([
            "{$osUrl}/api/ordens*" => Http::response([
                ['id' => 1, 'titulo' => 'Manutenção Fibra', 'tecnico_id' => 10],
            ], 200),
            "{$tecnicosUrl}/api/tecnicos*" => Http::response([
                ['id' => 10, 'nome' => 'Carlos Silva', 'especialidade' => 'Fibra Óptica'],
            ], 200),
        ]);

        $response = $this->get('/api/bff/ordens-com-tecnicos');

        $response->assertStatus(200);
        $response->assertJsonPath('total_ordens_compostas', 1);
        $response->assertJsonPath('data.0.tecnico_detalhes.nome', 'Carlos Silva');
        $response->assertHeader('X-Gateway-Route', 'bff-service-composition');
    }

    /**
     * Testa o Proxy Reverso para Ordens de Serviço.
     */
    public function test_reverse_proxy_forwards_orders_request(): void
    {
        $osUrl = config('services.os.url');

        Http::fake([
            "{$osUrl}/api/ordens" => Http::response([
                ['id' => 1, 'cliente' => 'Hospital Central'],
            ], 200, ['Content-Type' => 'application/json']),
        ]);

        $response = $this->get('/api/ordens');

        $response->assertStatus(200);
        $response->assertHeader('X-Gateway-Route', 'os-service');
        $response->assertJson([
            ['id' => 1, 'cliente' => 'Hospital Central'],
        ]);
    }
}
