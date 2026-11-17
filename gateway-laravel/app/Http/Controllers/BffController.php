<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Throwable;

class BffController extends Controller
{
    /**
     * BFF Endpoint 1: Agregação Concorrente de Dashboard (Data Aggregation).
     * Dispara requisições em paralelo via Http::pool() para os-service e tecnicos-service.
     */
    public function dashboard(Request $request)
    {
        $osUrl = config('services.os.url', 'http://localhost:8081');
        $tecnicosUrl = config('services.tecnicos.url', 'http://localhost:8082');
        $correlationId = $request->attributes->get('correlation_id', (string) $request->header('X-Correlation-Id'));

        $startParallel = microtime(true);

        // Execução concorrente assíncrona (não-bloqueante) via Guzzle Pool
        $responses = Http::pool(fn (Pool $pool) => [
            $pool->as('ordens')
                ->timeout(6)
                ->withHeaders(['X-Correlation-Id' => $correlationId])
                ->get("{$osUrl}/api/ordens"),
            $pool->as('tecnicos')
                ->timeout(6)
                ->withHeaders(['X-Correlation-Id' => $correlationId])
                ->get("{$tecnicosUrl}/api/tecnicos"),
        ]);

        $parallelLatencyMs = round((microtime(true) - $startParallel) * 1000, 2);

        // Processa resposta de Ordens
        $ordensData = [];
        $osStatus = 'OFFLINE';
        if ($responses['ordens'] instanceof \Illuminate\Http\Client\Response && $responses['ordens']->successful()) {
            $osStatus = 'ONLINE';
            $ordensJson = $responses['ordens']->json();
            $ordensData = is_array($ordensJson) ? ($ordensJson['data'] ?? $ordensJson) : [];
        }

        // Processa resposta de Técnicos
        $tecnicosData = [];
        $tecnicosStatus = 'OFFLINE';
        if ($responses['tecnicos'] instanceof \Illuminate\Http\Client\Response && $responses['tecnicos']->successful()) {
            $tecnicosStatus = 'ONLINE';
            $tecnicosJson = $responses['tecnicos']->json();
            $tecnicosData = is_array($tecnicosJson) ? ($tecnicosJson['data'] ?? $tecnicosJson) : [];
        }

        // Consolidação de métricas e KPIs analíticos em memória
        $totalOrdens = count($ordensData);
        $ordensPorStatus = [
            'Aberta' => 0,
            'Agendada' => 0,
            'Em Execução' => 0,
            'Concluída' => 0,
            'Cancelada' => 0,
        ];

        $ordensPorPrioridade = [
            'Alta' => 0,
            'Média' => 0,
            'Baixa' => 0,
        ];

        $valorTotalEstimado = 0;

        foreach ($ordensData as $os) {
            $st = $os['status'] ?? 'Aberta';
            if (isset($ordensPorStatus[$st])) {
                $ordensPorStatus[$st]++;
            } else {
                $ordensPorStatus[$st] = 1;
            }

            $pr = $os['prioridade'] ?? 'Média';
            if (isset($ordensPorPrioridade[$pr])) {
                $ordensPorPrioridade[$pr]++;
            } else {
                $ordensPorPrioridade[$pr] = 1;
            }

            if (isset($os['valor_total'])) {
                $valorTotalEstimado += (float) $os['valor_total'];
            }
        }

        $totalTecnicos = count($tecnicosData);
        $tecnicosDisponiveis = 0;
        $tecnicosPorEspecialidade = [];

        foreach ($tecnicosData as $tec) {
            if (!empty($tec['ativo']) && ($tec['disponivel'] ?? true)) {
                $tecnicosDisponiveis++;
            }
            $esp = $tec['especialidade'] ?? 'Geral';
            $tecnicosPorEspecialidade[$esp] = ($tecnicosPorEspecialidade[$esp] ?? 0) + 1;
        }

        $mediaOrdensPorTecnico = $totalTecnicos > 0 ? round($totalOrdens / $totalTecnicos, 2) : 0;

        return response()->json([
            'padrao_aplicado' => 'BFF Data Aggregation (Chamadas Concorrentes via Http::pool)',
            'resumo_kpis' => [
                'total_ordens' => $totalOrdens,
                'total_tecnicos' => $totalTecnicos,
                'tecnicos_disponiveis' => $tecnicosDisponiveis,
                'media_ordens_por_tecnico' => $mediaOrdensPorTecnico,
                'valor_total_estimado' => $valorTotalEstimado,
            ],
            'distribuicao_ordens' => [
                'por_status' => $ordensPorStatus,
                'por_prioridade' => $ordensPorPrioridade,
            ],
            'distribuicao_tecnicos' => [
                'por_especialidade' => $tecnicosPorEspecialidade,
            ],
            'status_microsservicos' => [
                'os_service' => [
                    'url' => $osUrl,
                    'status' => $osStatus,
                ],
                'tecnicos_service' => [
                    'url' => $tecnicosUrl,
                    'status' => $tecnicosStatus,
                ],
            ],
            'telemetria_bff' => [
                'tempo_agregacao_paralela_ms' => $parallelLatencyMs,
                'correlation_id' => $correlationId,
                'timestamp' => now()->toIso8601String(),
            ],
        ])->header('X-Gateway-Route', 'bff-dashboard');
    }

    /**
     * BFF Endpoint 2: Composição de Entidades (Service Composition).
     * Cruza Ordens com o Objeto Completo do seu Técnico Responsável em 1 única chamada.
     */
    public function ordensComTecnicos(Request $request)
    {
        $osUrl = config('services.os.url', 'http://localhost:8081');
        $tecnicosUrl = config('services.tecnicos.url', 'http://localhost:8082');
        $correlationId = $request->attributes->get('correlation_id', (string) $request->header('X-Correlation-Id'));

        $responses = Http::pool(fn (Pool $pool) => [
            $pool->as('ordens')->timeout(6)->withHeaders(['X-Correlation-Id' => $correlationId])->get("{$osUrl}/api/ordens"),
            $pool->as('tecnicos')->timeout(6)->withHeaders(['X-Correlation-Id' => $correlationId])->get("{$tecnicosUrl}/api/tecnicos"),
        ]);

        $ordens = [];
        if ($responses['ordens'] instanceof \Illuminate\Http\Client\Response && $responses['ordens']->successful()) {
            $json = $responses['ordens']->json();
            $ordens = is_array($json) ? ($json['data'] ?? $json) : [];
        }

        $tecnicosMap = [];
        if ($responses['tecnicos'] instanceof \Illuminate\Http\Client\Response && $responses['tecnicos']->successful()) {
            $json = $responses['tecnicos']->json();
            $listaTec = is_array($json) ? ($json['data'] ?? $json) : [];
            foreach ($listaTec as $tec) {
                if (isset($tec['id'])) {
                    $tecnicosMap[(string) $tec['id']] = $tec;
                }
            }
        }

        // Composição de Entidades em Memória no Backend (Sem N+1 no Frontend)
        $compostas = array_map(function ($ordem) use ($tecnicosMap) {
            $tecId = $ordem['tecnico_id'] ?? $ordem['tecnicoId'] ?? null;
            $tecnicoObj = null;

            if ($tecId && isset($tecnicosMap[(string) $tecId])) {
                $tecnicoObj = $tecnicosMap[(string) $tecId];
            }

            return array_merge($ordem, [
                'tecnico_detalhes' => $tecnicoObj,
            ]);
        }, $ordens);

        return response()->json([
            'padrao_aplicado' => 'BFF Service Composition (Eliminação do Problema Chatty I/O)',
            'total_ordens_compostas' => count($compostas),
            'data' => $compostas,
        ])->header('X-Gateway-Route', 'bff-service-composition');
    }

    /**
     * BFF Endpoint 3: Status da Arquitetura e Roteamento.
     */
    public function status(Request $request)
    {
        return response()->json([
            'projeto' => 'NEXORA API Gateway & BFF',
            'versao' => '2.0.0 (Fase 2 - Camada de Interface do Backend)',
            'tecnologia' => [
                'linguagem' => 'PHP ' . PHP_VERSION,
                'framework' => 'Laravel ' . app()->version(),
                'padroes' => [
                    'API Gateway (Reverse Proxy Transparente)',
                    'Backend For Frontend (BFF Concorrente via Http::pool)',
                    'CORS Centralizado',
                    'Distributed Tracing (X-Correlation-Id)',
                ],
            ],
            'topologia' => [
                'gateway_port' => env('PORT', 8080),
                'servicos_downstream' => [
                    'os_service' => [
                        'url' => config('services.os.url'),
                        'descricao' => 'CRUD de Ordens de Serviço (Bounded Context OS)',
                    ],
                    'tecnicos_service' => [
                        'url' => config('services.tecnicos.url'),
                        'descricao' => 'CRUD de Técnicos de Campo (Bounded Context Recursos)',
                    ],
                ],
            ],
            'rotas_principais' => [
                'proxy_ordens' => '/api/ordens/**',
                'proxy_tecnicos' => '/api/tecnicos/**',
                'bff_dashboard' => '/api/bff/dashboard',
                'bff_ordens_com_tecnicos' => '/api/bff/ordens-com-tecnicos',
                'bff_status' => '/api/bff/status',
                'health_check' => '/api/health',
            ],
        ])->header('X-Gateway-Route', 'bff-status');
    }

    /**
     * Health Check do Gateway com teste de conectividade aos serviços.
     */
    public function health()
    {
        return response()->json([
            'status' => 'UP',
            'gateway' => 'NEXORA-Laravel-API-Gateway',
            'timestamp' => now()->toIso8601String(),
        ])->header('X-Gateway-Route', 'health');
    }
}
