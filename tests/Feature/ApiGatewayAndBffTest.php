<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiGatewayAndBffTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_bff_status_returns_fase_2_topology_and_gateway_observability_headers(): void
    {
        $response = $this->getJson('/api/bff/status');

        $response->assertStatus(200)
            ->assertJson([
                'projeto' => 'NEXORA — API Gateway & BFF (Laravel MVC)',
                'fase' => 'Fase 2 - Ponto Único Centralizado',
                'porta_gateway' => 8080,
                'cors_centralizado' => true,
                'status_microsservicos' => [
                    'ordens-service' => 'UP',
                    'alocacoes-service' => 'UP',
                ],
            ])
            ->assertJsonStructure([
                'projeto',
                'fase',
                'porta_gateway',
                'rotas_ativas',
                'cors_centralizado',
                'origens_mfe_permitidas',
                'status_microsservicos',
                'timestamp',
            ]);

        $response->assertHeader('X-Gateway-Processed-By', 'NEXORA-API-Gateway-BFF');
        $response->assertHeader('X-Gateway-Route', 'bff-service');
        $this->assertNotEmpty($response->headers->get('X-Correlation-Id'));
        $this->assertNotNull($response->headers->get('X-Gateway-Execution-Time-Ms'));
    }

    public function test_correlation_id_is_preserved_when_provided_by_client(): void
    {
        $customCorrelationId = 'nexora-trace-corr-998877';

        $response = $this->withHeaders([
            'X-Correlation-Id' => $customCorrelationId,
        ])->getJson('/api/bff/status');

        $response->assertStatus(200)
            ->assertHeader('X-Correlation-Id', $customCorrelationId)
            ->assertHeader('X-Gateway-Processed-By', 'NEXORA-API-Gateway-BFF');
    }

    public function test_bff_dashboard_aggregates_orders_and_technician_workload(): void
    {
        $response = $this->getJson('/api/bff/dashboard');

        $response->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'bff-service')
            ->assertJson([
                'totalOrdens' => 5,
                'ordensConcluidas' => 2,
                'ordensEmAndamento' => 2,
                'ordensAbertas' => 1,
                'taxaConclusaoPercentual' => 40.0,
                'volumeFinanceiroTotal' => 6300.00,
            ])
            ->assertJsonStructure([
                'totalOrdens',
                'ordensConcluidas',
                'ordensEmAndamento',
                'ordensAbertas',
                'taxaConclusaoPercentual',
                'volumeFinanceiroTotal',
                'distribuicaoStatus',
                'distribuicaoPrioridade',
                'cargaPorTecnico',
                'statusServicos',
                'statusMicrosservicos',
            ]);

        $this->assertGreaterThanOrEqual(5, count($response->json('cargaPorTecnico')));
    }

    public function test_bff_order_composition_combines_order_technician_sla_and_financials(): void
    {
        $response = $this->getJson('/api/bff/ordens/OS-1001');

        $response->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'bff-service')
            ->assertJsonPath('ordem.codigo', 'OS-1001')
            ->assertJsonPath('ordem.cliente', 'Hospital Central São Lucas')
            ->assertJsonPath('tecnico.nome', 'Henrique Ricardo')
            ->assertJsonPath('slaHoras', 8)
            ->assertJsonPath('percentualAdicionalPrioridade', 15)
            ->assertJsonPath('valorFinalEstimado', 2127.5)
            ->assertJsonStructure([
                'ordem' => ['id', 'codigo', 'cliente', 'servico', 'prioridade', 'situacao', 'valorEstimado'],
                'tecnico' => ['id', 'nome', 'especialidade', 'telefone'],
                'itensServico',
                'historicoExecucao',
                'metricasSla' => ['slaHoras', 'tempoDecorridoMinutos', 'tempoRestanteMinutos', 'slaEmRisco'],
                'valorizacao' => ['valorBase', 'percentualAdicionalPrioridade', 'valorFinalEstimado'],
            ]);
    }

    public function test_bff_order_composition_returns_404_when_order_not_found(): void
    {
        $response = $this->getJson('/api/bff/ordens/OS-9999');

        $response->assertStatus(404)
            ->assertHeader('X-Gateway-Route', 'bff-service')
            ->assertJsonFragment(['codigo' => 'OS-9999']);
    }

    public function test_gateway_proxy_ordens_crud_lifecycle_and_route_header(): void
    {
        // 1. List orders (GET /api/ordens)
        $listResponse = $this->getJson('/api/ordens');
        $listResponse->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'ordens-service')
            ->assertHeader('X-Gateway-Processed-By', 'NEXORA-API-Gateway-BFF')
            ->assertJsonPath('total', 5);

        // 2. Create order (POST /api/ordens)
        $createResponse = $this->postJson('/api/ordens', [
            'codigo' => 'OS-2050',
            'cliente' => 'Indústria Metalúrgica Atlas',
            'servico' => 'Inspeção termográfica em painel de média tensão',
            'prioridade' => 'Alta',
            'valor_estimado' => 1500.00,
        ]);

        $createResponse->assertStatus(201)
            ->assertHeader('X-Gateway-Route', 'ordens-service')
            ->assertJsonPath('codigo', 'OS-2050')
            ->assertJsonPath('situacao', 'Aberta');

        // 3. Get single order (GET /api/ordens/OS-2050)
        $showResponse = $this->getJson('/api/ordens/OS-2050');
        $showResponse->assertStatus(200)
            ->assertJsonPath('cliente', 'Indústria Metalúrgica Atlas');

        // 4. Update order (PUT /api/ordens/OS-2050)
        $updateResponse = $this->putJson('/api/ordens/OS-2050', [
            'prioridade' => 'Urgente',
            'valor_estimado' => 1750.00,
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('prioridade', 'Urgente')
            ->assertJsonPath('valor_estimado', 1750);

        // 5. Complete order (PATCH /api/ordens/OS-2050/concluir)
        $completeResponse = $this->patchJson('/api/ordens/OS-2050/concluir', [
            'valor_final' => 1800.00,
        ]);
        $completeResponse->assertStatus(200)
            ->assertJsonPath('situacao', 'Concluída')
            ->assertJsonPath('valor_final', 1800);

        // 6. Delete order (DELETE /api/ordens/OS-2050)
        $deleteResponse = $this->deleteJson('/api/ordens/OS-2050');
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('removido', true);
    }

    public function test_gateway_proxy_alocacoes_and_dashboard_kpis_route_to_alocacoes_service(): void
    {
        $alocacoesResponse = $this->getJson('/api/alocacoes');
        $alocacoesResponse->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'alocacoes-service')
            ->assertJsonPath('servico', 'alocacoes-service');

        $assignResponse = $this->postJson('/api/alocacoes/OS-1003/atribuir', [
            'tecnico_id' => 3,
        ]);
        $assignResponse->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'alocacoes-service')
            ->assertJsonPath('alocado', true)
            ->assertJsonPath('ordem.situacao', 'Agendada')
            ->assertJsonPath('tecnico.nome', 'Éden Samuel');

        $kpisResponse = $this->getJson('/api/dashboard/kpis');
        $kpisResponse->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'alocacoes-service')
            ->assertJsonPath('totalOrdens', 5);
    }

    public function test_centralized_cors_preflight_and_allowed_mfe_origins(): void
    {
        $preflight = $this->call('OPTIONS', '/api/bff/dashboard', [], [], [], [
            'HTTP_ORIGIN' => 'http://localhost:3000',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ]);

        $this->assertTrue(in_array($preflight->getStatusCode(), [200, 204], true));
        $preflight->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        $this->assertStringContainsString('GET', (string) $preflight->headers->get('Access-Control-Allow-Methods'));
        $this->assertStringContainsString('X-Correlation-Id', (string) $preflight->headers->get('Access-Control-Expose-Headers'));

        $azureOriginResponse = $this->withHeaders([
            'Origin' => 'https://nexora-host-fernando.azurewebsites.net',
        ])->getJson('/api/bff/status');

        $azureOriginResponse->assertStatus(200)
            ->assertHeader('Access-Control-Allow-Origin', 'https://nexora-host-fernando.azurewebsites.net');
    }

    public function test_bff_visao_geral_returns_complete_aggregated_single_response(): void
    {
        $response = $this->getJson('/api/bff/visao-geral');

        $response->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'bff-service')
            ->assertHeader('X-Gateway-Processed-By', 'NEXORA-API-Gateway-BFF')
            ->assertJsonStructure([
                'agregadoPor',
                'arquitetura',
                'fontesConsultadas' => [
                    'microservico_1_mongo' => ['servico', 'banco', 'dominio', 'status'],
                    'microservico_2_sql' => ['servico', 'banco', 'dominio', 'status'],
                    'message_broker' => ['broker', 'fila', 'regraNegocio'],
                ],
                'resumoExecutivo',
                'kpis' => [
                    'totalOrdens',
                    'ordensConcluidas',
                    'ordensEmAndamento',
                    'ordensAbertas',
                    'taxaConclusaoPercentual',
                    'volumeFinanceiroTotal',
                    'totalTecnicos',
                    'tecnicosDisponiveis',
                ],
                'mensageria' => ['broker', 'fila', 'fluxo'],
                'ordens',
                'tecnicos',
                'timestamp',
            ]);

        $this->assertGreaterThanOrEqual(5, count($response->json('ordens')));
        $this->assertGreaterThanOrEqual(5, count($response->json('tecnicos')));
    }

    public function test_gateway_proxy_tecnicos_crud_lifecycle_and_route_header(): void
    {
        // 1. Listar técnicos (GET /api/tecnicos)
        $listResponse = $this->getJson('/api/tecnicos');
        $listResponse->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'tecnicos-service')
            ->assertHeader('X-Gateway-Processed-By', 'NEXORA-API-Gateway-BFF');
        $this->assertGreaterThanOrEqual(5, count($listResponse->json()));

        // 2. Criar técnico (POST /api/tecnicos)
        $createResponse = $this->postJson('/api/tecnicos', [
            'nome' => 'Hugo Takeda Cloud',
            'especialidade' => 'Infraestrutura e Redes',
            'telefone' => '(11) 97777-8888',
            'email' => 'hugo.cloud@nexora.com.br',
            'regiao' => 'São Paulo - Zona Sul',
            'status' => 'Disponível',
        ]);
        $createResponse->assertStatus(201)
            ->assertHeader('X-Gateway-Route', 'tecnicos-service')
            ->assertJsonPath('nome', 'Hugo Takeda Cloud')
            ->assertJsonPath('status', 'Disponível');

        $tecnicoId = $createResponse->json('id');
        $this->assertNotEmpty($tecnicoId);

        // 3. Detalhar técnico (GET /api/tecnicos/{id})
        $showResponse = $this->getJson("/api/tecnicos/{$tecnicoId}");
        $showResponse->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'tecnicos-service')
            ->assertJsonPath('nome', 'Hugo Takeda Cloud');

        // 4. Atualizar técnico (PUT /api/tecnicos/{id})
        $updateResponse = $this->putJson("/api/tecnicos/{$tecnicoId}", [
            'especialidade' => 'Climatização Hospitalar',
            'regiao' => 'São Paulo - Centro',
        ]);
        $updateResponse->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'tecnicos-service')
            ->assertJsonPath('especialidade', 'Climatização Hospitalar');

        // 5. Atualizar disponibilidade (PATCH /api/tecnicos/{id}/disponibilidade)
        $patchResponse = $this->patchJson("/api/tecnicos/{$tecnicoId}/disponibilidade", [
            'status' => 'Em Atendimento',
        ]);
        $patchResponse->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'tecnicos-service')
            ->assertJsonPath('status', 'Em Atendimento')
            ->assertJsonPath('disponivel', false);

        // 6. Excluir técnico (DELETE /api/tecnicos/{id})
        $deleteResponse = $this->deleteJson("/api/tecnicos/{$tecnicoId}");
        $deleteResponse->assertStatus(200)
            ->assertHeader('X-Gateway-Route', 'tecnicos-service')
            ->assertJsonPath('removido', true);
    }

    public function test_gateway_swagger_openapi_json_and_ui_endpoints(): void
    {
        $specResponse = $this->getJson('/api/openapi.json');
        $specResponse->assertStatus(200)
            ->assertJsonPath('openapi', '3.0.0')
            ->assertJsonStructure([
                'openapi',
                'info' => ['title', 'description', 'version'],
                'paths' => [
                    '/api/bff/visao-geral',
                    '/api/bff/dashboard',
                    '/api/ordens',
                    '/api/tecnicos',
                ],
            ]);

        $uiResponse = $this->get('/api-docs');
        $uiResponse->assertStatus(200);
        $this->assertStringContainsString('Swagger OpenAPI 3.0', $uiResponse->getContent());
    }
}

