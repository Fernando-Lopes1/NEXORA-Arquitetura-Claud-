<?php

namespace App\Gateway\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

/**
 * API Gateway & BFF OpenAPI 3.0 / Swagger Controller
 *
 * Exposes:
 * - GET /api/openapi.json (OpenAPI 3.0 Specification)
 * - GET /api-docs (Interactive Swagger UI)
 */
class GatewaySwaggerController extends Controller
{
    public function openapi(): JsonResponse
    {
        $spec = [
            'openapi' => '3.0.0',
            'info' => [
                'title' => 'NEXORA — API Gateway & BFF (Clean/Hexagonal Architecture, CQRS, SOLID & Azure Cloud)',
                'version' => '3.0.0',
                'description' => 'Ponto Único de Entrada (Single Point of Entry), Reverse Proxy CRUD, Segurança, CORS Centralizado e Agregação BFF para o Microfrontend SPA NEXORA. Integra o Microserviço 1 (tecnicos-service — MongoDB Atlas), o Microserviço 2 (os-service — Azure SQL Database) e a mensageria assíncrona via Azure Service Bus (nexora-ordens-eventos).',
            ],
            'servers' => [
                [
                    'url' => 'http://localhost:8080',
                    'description' => 'API Gateway & BFF Local (:8080)',
                ],
                [
                    'url' => 'https://nexora-gateway-api.azurewebsites.net',
                    'description' => 'API Gateway & BFF Produção Microsoft Azure',
                ],
            ],
            'tags' => [
                [
                    'name' => '1. BFF — Agregação & Composição',
                    'description' => 'Consulta simultânea ao Microserviço MongoDB Atlas e ao Microserviço Azure SQL retornando tudo em um único response JSON',
                ],
                [
                    'name' => '2. Proxy CRUD — Microserviço 1 (MongoDB Atlas: Técnicos)',
                    'description' => 'Roteamento e Proxy CRUD completo para tecnicos-service (:8082 / MongoDB Atlas Free Tier)',
                ],
                [
                    'name' => '3. Proxy CRUD — Microserviço 2 (Azure SQL: Ordens de Serviço)',
                    'description' => 'Roteamento e Proxy CRUD completo para os-service (:8081 / Azure SQL Database Free 1 DTU) com disparo no Azure Service Bus',
                ],
                [
                    'name' => '4. Saga Pattern & Event Sourcing (DDD / CQRS)',
                    'description' => 'Orquestrador Saga Distribuído e Event Store Imutável',
                ],
            ],
            'paths' => [
                '/api/bff/visao-geral' => [
                    'get' => [
                        'tags' => ['1. BFF — Agregação & Composição'],
                        'summary' => 'Agregação Completa em Único Response (Ordens Azure SQL + Técnicos MongoDB Atlas + Broker Azure Service Bus + KPIs)',
                        'responses' => [
                            '200' => [
                                'description' => 'Payload único agregado para o Microfrontend SPA',
                            ],
                        ],
                    ],
                ],
                '/api/bff/dashboard' => [
                    'get' => [
                        'tags' => ['1. BFF — Agregação & Composição'],
                        'summary' => 'Dashboard Executivo Consolidado (KPIs multi-domínio)',
                        'responses' => [
                            '200' => [
                                'description' => 'Métricas consolidadas de Ordens e Técnicos',
                            ],
                        ],
                    ],
                ],
                '/api/bff/ordens/{id}' => [
                    'get' => [
                        'tags' => ['1. BFF — Agregação & Composição'],
                        'summary' => 'Composição Vertical de Ordem de Serviço (Ordem + Técnico + SLA + Precificação Strategy)',
                        'parameters' => [
                            [
                                'name' => 'id',
                                'in' => 'path',
                                'required' => true,
                                'schema' => ['type' => 'string', 'example' => 'OS-1001'],
                            ],
                        ],
                        'responses' => [
                            '200' => ['description' => 'Visão composta da Ordem de Serviço'],
                            '404' => ['description' => 'Ordem de Serviço não encontrada'],
                        ],
                    ],
                ],
                '/api/bff/status' => [
                    'get' => [
                        'tags' => ['1. BFF — Agregação & Composição'],
                        'summary' => 'Topologia do API Gateway & BFF, Segurança, CORS e Saúde dos Microsserviços',
                        'responses' => [
                            '200' => ['description' => 'Status operacional do Gateway'],
                        ],
                    ],
                ],
                '/api/tecnicos' => [
                    'get' => [
                        'tags' => ['2. Proxy CRUD — Microserviço 1 (MongoDB Atlas: Técnicos)'],
                        'summary' => 'Lista Técnicos de Campo (Proxy -> Microserviço MongoDB Atlas)',
                        'responses' => ['200' => ['description' => 'Lista de técnicos']],
                    ],
                    'post' => [
                        'tags' => ['2. Proxy CRUD — Microserviço 1 (MongoDB Atlas: Técnicos)'],
                        'summary' => 'Cadastra novo Técnico de Campo no MongoDB Atlas via Gateway',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['nome', 'especialidade'],
                                        'properties' => [
                                            'nome' => ['type' => 'string', 'example' => 'Fernando Lopes'],
                                            'especialidade' => ['type' => 'string', 'example' => 'Climatização'],
                                            'telefone' => ['type' => 'string', 'example' => '(41) 98888-1234'],
                                            'email' => ['type' => 'string', 'example' => 'fernando@nexora.com.br'],
                                            'regiao' => ['type' => 'string', 'example' => 'Curitiba - Centro'],
                                            'status' => ['type' => 'string', 'example' => 'Disponível'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => ['201' => ['description' => 'Técnico criado com sucesso']],
                    ],
                ],
                '/api/tecnicos/{id}' => [
                    'get' => [
                        'tags' => ['2. Proxy CRUD — Microserviço 1 (MongoDB Atlas: Técnicos)'],
                        'summary' => 'Obtém Técnico por ID (Proxy -> MongoDB Atlas)',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer', 'example' => 1]],
                        ],
                        'responses' => ['200' => ['description' => 'Detalhes do técnico'], '404' => ['description' => 'Não encontrado']],
                    ],
                    'put' => [
                        'tags' => ['2. Proxy CRUD — Microserviço 1 (MongoDB Atlas: Técnicos)'],
                        'summary' => 'Atualiza Técnico de Campo no MongoDB Atlas via Gateway',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer', 'example' => 1]],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'nome' => ['type' => 'string'],
                                            'especialidade' => ['type' => 'string'],
                                            'telefone' => ['type' => 'string'],
                                            'email' => ['type' => 'string'],
                                            'regiao' => ['type' => 'string'],
                                            'status' => ['type' => 'string'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => ['200' => ['description' => 'Técnico atualizado']],
                    ],
                    'delete' => [
                        'tags' => ['2. Proxy CRUD — Microserviço 1 (MongoDB Atlas: Técnicos)'],
                        'summary' => 'Remove Técnico de Campo no MongoDB Atlas via Gateway',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer', 'example' => 1]],
                        ],
                        'responses' => ['200' => ['description' => 'Técnico removido']],
                    ],
                ],
                '/api/tecnicos/{id}/disponibilidade' => [
                    'patch' => [
                        'tags' => ['2. Proxy CRUD — Microserviço 1 (MongoDB Atlas: Técnicos)'],
                        'summary' => 'Altera Disponibilidade do Técnico (Disponível | Em Atendimento | Ausente)',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer', 'example' => 1]],
                        ],
                        'responses' => ['200' => ['description' => 'Disponibilidade atualizada']],
                    ],
                ],
                '/api/ordens' => [
                    'get' => [
                        'tags' => ['3. Proxy CRUD — Microserviço 2 (Azure SQL: Ordens de Serviço)'],
                        'summary' => 'Lista Ordens de Serviço (Proxy -> Microserviço Azure SQL Database)',
                        'responses' => ['200' => ['description' => 'Lista de Ordens de Serviço']],
                    ],
                    'post' => [
                        'tags' => ['3. Proxy CRUD — Microserviço 2 (Azure SQL: Ordens de Serviço)'],
                        'summary' => 'Cria Ordem de Serviço no Azure SQL e publica evento no Azure Service Bus',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['cliente', 'servico'],
                                        'properties' => [
                                            'cliente' => ['type' => 'string', 'example' => 'Hospital Central São Lucas'],
                                            'servico' => ['type' => 'string', 'example' => 'Manutenção preventiva em Chiller'],
                                            'tecnico' => ['type' => 'string', 'example' => 'Henrique Ricardo'],
                                            'prioridade' => ['type' => 'string', 'example' => 'Alta'],
                                            'situacao' => ['type' => 'string', 'example' => 'Agendada'],
                                            'valor_estimado' => ['type' => 'number', 'example' => 1850.00],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => ['201' => ['description' => 'Ordem criada e evento enviado ao Broker']],
                    ],
                ],
                '/api/ordens/{id}' => [
                    'get' => [
                        'tags' => ['3. Proxy CRUD — Microserviço 2 (Azure SQL: Ordens de Serviço)'],
                        'summary' => 'Consulta Ordem de Serviço por ID ou Código',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string', 'example' => 'OS-1001']],
                        ],
                        'responses' => ['200' => ['description' => 'Detalhes da Ordem']],
                    ],
                    'put' => [
                        'tags' => ['3. Proxy CRUD — Microserviço 2 (Azure SQL: Ordens de Serviço)'],
                        'summary' => 'Atualiza Ordem de Serviço no Azure SQL e sincroniza Técnico via Azure Service Bus',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string', 'example' => 'OS-1001']],
                        ],
                        'responses' => ['200' => ['description' => 'Ordem atualizada']],
                    ],
                    'delete' => [
                        'tags' => ['3. Proxy CRUD — Microserviço 2 (Azure SQL: Ordens de Serviço)'],
                        'summary' => 'Remove Ordem de Serviço no Azure SQL via Gateway',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string', 'example' => 'OS-1001']],
                        ],
                        'responses' => ['200' => ['description' => 'Ordem removida']],
                    ],
                ],
                '/api/ordens/{id}/concluir' => [
                    'patch' => [
                        'tags' => ['3. Proxy CRUD — Microserviço 2 (Azure SQL: Ordens de Serviço)'],
                        'summary' => 'Conclui Ordem de Serviço e libera Técnico via Azure Service Bus',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string', 'example' => 'OS-1001']],
                        ],
                        'responses' => ['200' => ['description' => 'Ordem concluída']],
                    ],
                ],
                '/api/saga/ordens' => [
                    'post' => [
                        'tags' => ['4. Saga Pattern & Event Sourcing (DDD / CQRS)'],
                        'summary' => 'Executa Saga Distribuída de Abertura de OS com Compensação e Event Store',
                        'responses' => ['201' => ['description' => 'Saga executada com sucesso']],
                    ],
                ],
            ],
        ];

        return response()->json($spec, 200);
    }

    public function ui(): Response
    {
        $html = <<<'HTML'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXORA — API Gateway & BFF Swagger UI (OpenAPI 3.0)</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; color: #0f172a; }
    .banner {
      background: linear-gradient(90deg, #06265F 0%, #0B5FD7 100%);
      color: #fff;
      padding: 18px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .banner h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .banner p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
    .badge-spec {
      background: rgba(255,255,255,0.18);
      padding: 6px 12px;
      border-radius: 999px;
      color: #fff;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
    }
    .container { max-width: 1120px; margin: 24px auto; padding: 0 20px; }
    .tag-card {
      background: #fff;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .tag-header {
      padding: 14px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 700;
      font-size: 16px;
      color: #06265F;
    }
    .endpoint {
      padding: 12px 20px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .method {
      font-weight: 700;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 5px;
      min-width: 68px;
      text-align: center;
      color: #fff;
      text-transform: uppercase;
    }
    .method-get { background: #0284c7; }
    .method-post { background: #16a34a; }
    .method-put { background: #d97706; }
    .method-patch { background: #7c3aed; }
    .method-delete { background: #dc2626; }
    .path { font-family: monospace; font-weight: 700; font-size: 14px; color: #0f172a; }
    .summary { font-size: 13px; color: #475569; flex: 1; }
    .btn-try {
      background: #0B5FD7;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .output-box {
      background: #0f172a;
      color: #e2e8f0;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      margin-bottom: 24px;
      max-height: 360px;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="banner">
    <div>
      <h1>🛡️ NEXORA — API Gateway & BFF (Swagger OpenAPI 3.0)</h1>
      <p>Single Point of Entry • BFF Aggregation • Microserviço 1 (MongoDB Atlas) • Microserviço 2 (Azure SQL) • Azure Service Bus</p>
    </div>
    <a class="badge-spec" href="/api/openapi.json" target="_blank" rel="noopener">📄 /api/openapi.json</a>
  </div>
  <div class="container">
    <div id="output" class="output-box">Clique em "Executar (Try it out)" em qualquer rota abaixo para inspecionar a resposta e os headers X-Gateway-* do API Gateway & BFF.</div>
    <div id="endpoints-root"></div>
  </div>
  <script>
    async function loadSpec() {
      const res = await fetch('/api/openapi.json');
      const spec = await res.json();
      const root = document.getElementById('endpoints-root');
      root.replaceChildren();

      const groups = {};
      for (const [pathStr, methods] of Object.entries(spec.paths || {})) {
        for (const [method, info] of Object.entries(methods)) {
          const tag = (info.tags && info.tags[0]) || 'Geral';
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push({ pathStr, method, info });
        }
      }

      for (const [tag, list] of Object.entries(groups)) {
        const card = document.createElement('div');
        card.className = 'tag-card';

        const header = document.createElement('div');
        header.className = 'tag-header';
        header.textContent = tag;
        card.appendChild(header);

        for (const item of list) {
          const row = document.createElement('div');
          row.className = 'endpoint';

          const badge = document.createElement('span');
          badge.className = 'method method-' + item.method.toLowerCase();
          badge.textContent = item.method.toUpperCase();

          const pathEl = document.createElement('span');
          pathEl.className = 'path';
          pathEl.textContent = item.pathStr;

          const sumEl = document.createElement('span');
          sumEl.className = 'summary';
          sumEl.textContent = item.info.summary || '';

          const btn = document.createElement('button');
          btn.className = 'btn-try';
          btn.textContent = 'Executar (Try it out)';
          btn.addEventListener('click', () => executeEndpoint(item.method, item.pathStr));

          row.appendChild(badge);
          row.appendChild(pathEl);
          row.appendChild(sumEl);
          row.appendChild(btn);
          card.appendChild(row);
        }
        root.appendChild(card);
      }
    }

    async function executeEndpoint(method, pathTemplate) {
      const out = document.getElementById('output');
      const resolvedPath = pathTemplate.replace('{id}', 'OS-1001');
      out.textContent = 'Executando ' + method.toUpperCase() + ' ' + resolvedPath + ' ...';
      try {
        const opts = { method: method.toUpperCase(), headers: { 'Accept': 'application/json' } };
        if (method.toLowerCase() === 'post' && resolvedPath === '/api/ordens') {
          opts.headers['Content-Type'] = 'application/json';
          opts.body = JSON.stringify({
            cliente: 'Hospital Santa Casa (Teste Swagger Gateway)',
            servico: 'Manutenção preventiva de Chiller Central',
            tecnico: 'Henrique Ricardo',
            prioridade: 'Alta',
            situacao: 'Agendada',
            valor_estimado: 1500
          });
        } else if (method.toLowerCase() === 'post' && resolvedPath === '/api/tecnicos') {
          opts.headers['Content-Type'] = 'application/json';
          opts.body = JSON.stringify({
            nome: 'Hugo Takeda',
            especialidade: 'Elétrica',
            telefone: '(41) 98888-5555',
            email: 'hugo.takeda@nexora.com.br',
            regiao: 'Curitiba - Batel',
            status: 'Disponível'
          });
        }
        const res = await fetch(resolvedPath, opts);
        const body = await res.json();
        const gwHeaders = {
          'X-Correlation-Id': res.headers.get('X-Correlation-Id'),
          'X-Gateway-Processed-By': res.headers.get('X-Gateway-Processed-By'),
          'X-Gateway-Route': res.headers.get('X-Gateway-Route'),
          'X-Gateway-Execution-Time-Ms': res.headers.get('X-Gateway-Execution-Time-Ms')
        };
        out.textContent = 'HTTP ' + res.status + ' (' + method.toUpperCase() + ' ' + resolvedPath + ')\n' +
          'Gateway Headers: ' + JSON.stringify(gwHeaders, null, 2) + '\n\n' +
          JSON.stringify(body, null, 2);
      } catch (err) {
        out.textContent = 'Erro ao executar requisição: ' + err.message;
      }
    }

    loadSpec();
  </script>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    }
}
