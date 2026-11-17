<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GatewayProxyController extends Controller
{
    /**
     * Proxy Reverso para o microsserviço de Ordens de Serviço (os-service).
     */
    public function proxyOrdens(Request $request, ?string $any = null)
    {
        $baseUrl = config('services.os.url', 'http://localhost:8081');
        $targetPath = '/api/ordens' . ($any ? '/' . $any : '');
        return $this->forwardRequest($request, $baseUrl, $targetPath, 'os-service');
    }

    /**
     * Proxy Reverso para o microsserviço de Técnicos (tecnicos-service).
     */
    public function proxyTecnicos(Request $request, ?string $any = null)
    {
        $baseUrl = config('services.tecnicos.url', 'http://localhost:8082');
        $targetPath = '/api/tecnicos' . ($any ? '/' . $any : '');
        return $this->forwardRequest($request, $baseUrl, $targetPath, 'tecnicos-service');
    }

    /**
     * Encaminha transparentemente a requisição HTTP preservando método, headers, query e payload.
     */
    protected function forwardRequest(Request $request, string $baseUrl, string $targetPath, string $serviceName)
    {
        $targetUrl = rtrim($baseUrl, '/') . $targetPath;
        $correlationId = $request->attributes->get('correlation_id', (string) $request->header('X-Correlation-Id'));

        $headers = [
            'Accept' => 'application/json',
            'X-Correlation-Id' => $correlationId,
            'X-Forwarded-For' => $request->ip(),
            'X-Forwarded-Host' => $request->getHost(),
            'X-Forwarded-Port' => (string) $request->getPort(),
            'X-Forwarded-Proto' => $request->getScheme(),
        ];

        if ($request->header('Content-Type')) {
            $headers['Content-Type'] = $request->header('Content-Type');
        }

        try {
            $httpClient = Http::withHeaders($headers)
                ->timeout(10)
                ->connectTimeout(5);

            $method = strtoupper($request->method());
            $queryParams = $request->query();
            $bodyContent = $request->getContent();

            // Envia para o microsserviço de destino
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE']) && !empty($bodyContent)) {
                $response = $httpClient->withBody($bodyContent, $request->header('Content-Type', 'application/json'))
                    ->send($method, $targetUrl, ['query' => $queryParams]);
            } else {
                $response = $httpClient->send($method, $targetUrl, ['query' => $queryParams]);
            }

            // Constrói resposta devolvendo os dados exatos do microsserviço
            $clientResponse = response($response->body(), $response->status());
            
            // Repassa o Content-Type do downstream
            if ($response->header('Content-Type')) {
                $clientResponse->header('Content-Type', $response->header('Content-Type'));
            } else {
                $clientResponse->header('Content-Type', 'application/json; charset=utf-8');
            }

            $clientResponse->header('X-Gateway-Route', $serviceName);
            $clientResponse->header('X-Gateway-Target-Url', $targetUrl);

            return $clientResponse;

        } catch (Throwable $e) {
            Log::error("Erro no Proxy Reverso [{$serviceName}] -> {$targetUrl}: " . $e->getMessage(), [
                'correlation_id' => $correlationId,
                'method' => $request->method(),
                'target' => $targetUrl,
            ]);

            return response()->json([
                'erro' => 'Falha de comunicação com o microsserviço downstream.',
                'servico' => $serviceName,
                'target_url' => $targetUrl,
                'mensagem' => $e->getMessage(),
                'correlation_id' => $correlationId,
                'status' => 502,
            ], 502)
            ->header('X-Gateway-Route', $serviceName)
            ->header('X-Gateway-Error', 'DownstreamServiceUnavailable');
        }
    }
}
