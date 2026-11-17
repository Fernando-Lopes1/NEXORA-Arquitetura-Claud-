<?php

use App\Gateway\Controllers\BffController;
use App\Gateway\Controllers\GatewayProxyController;
use App\Gateway\Controllers\GatewaySwaggerController;
use App\Http\Controllers\Api\SagaAndEventSourcingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| NEXORA API Gateway & BFF Routes (Formativa 16, 17 & Projeto Final Cloud)
|--------------------------------------------------------------------------
|
| Single Point of Entry (Port :8080) with Global Middlewares:
| - CorrelationIdMiddleware (X-Correlation-Id)
| - GatewayObservabilityMiddleware (X-Gateway-Processed-By, X-Gateway-Route, X-Gateway-Execution-Time-Ms)
| - CentralizedCorsMiddleware (Multi-origin CORS for MFEs & Azure Web Apps)
|
*/

// CORS Preflight Catch-All for /api/**
Route::options('{any}', function () {
    return response('', 204);
})->where('any', '.*');

// OpenAPI 3.0 JSON Specification for API Gateway & BFF
Route::get('/openapi.json', [GatewaySwaggerController::class, 'openapi'])->name('api.gateway.openapi');

// =========================================================================
// 1. BFF (Backend for Frontend) Specialized Aggregation & Composition
// =========================================================================
Route::prefix('bff')->group(function () {
    Route::get('/status', [BffController::class, 'status'])->name('api.bff.status');
    Route::get('/dashboard', [BffController::class, 'dashboard'])->name('api.bff.dashboard');
    Route::get('/visao-geral', [BffController::class, 'visaoGeral'])->name('api.bff.visao_geral');
    Route::get('/ordens/{id}', [BffController::class, 'showOrdem'])->name('api.bff.ordens.show');
});

// =========================================================================
// 2. Microserviço 2 (Azure SQL Database): Ordens de Serviço (Proxy -> :8081)
// =========================================================================
Route::prefix('ordens')->group(function () {
    Route::get('/', [GatewayProxyController::class, 'listarOrdens'])->name('api.ordens.index');
    Route::post('/', [GatewayProxyController::class, 'criarOrdem'])->name('api.ordens.store');
    Route::get('/{id}', [GatewayProxyController::class, 'obterOrdem'])->name('api.ordens.show');
    Route::put('/{id}', [GatewayProxyController::class, 'atualizarOrdem'])->name('api.ordens.update');
    Route::patch('/{id}/concluir', [GatewayProxyController::class, 'concluirOrdem'])->name('api.ordens.concluir');
    Route::delete('/{id}', [GatewayProxyController::class, 'excluirOrdem'])->name('api.ordens.destroy');
});

// =========================================================================
// 3. Microserviço 1 (MongoDB Atlas): Técnicos de Campo & Alocações (Proxy -> :8082)
// =========================================================================
Route::prefix('tecnicos')->group(function () {
    Route::get('/', [GatewayProxyController::class, 'listarTecnicos'])->name('api.tecnicos.index');
    Route::post('/', [GatewayProxyController::class, 'criarTecnico'])->name('api.tecnicos.store');
    Route::get('/{id}', [GatewayProxyController::class, 'obterTecnico'])->name('api.tecnicos.show');
    Route::put('/{id}', [GatewayProxyController::class, 'atualizarTecnico'])->name('api.tecnicos.update');
    Route::patch('/{id}/disponibilidade', [GatewayProxyController::class, 'atualizarDisponibilidadeTecnico'])->name('api.tecnicos.disponibilidade');
    Route::delete('/{id}', [GatewayProxyController::class, 'excluirTecnico'])->name('api.tecnicos.destroy');
});

Route::prefix('alocacoes')->group(function () {
    Route::get('/', [GatewayProxyController::class, 'listarAlocacoes'])->name('api.alocacoes.index');
    Route::post('/{ordemId}/atribuir', [GatewayProxyController::class, 'atribuirTecnico'])->name('api.alocacoes.atribuir');
});

Route::get('/dashboard/kpis', [GatewayProxyController::class, 'obterKpisDashboard'])->name('api.dashboard.kpis');

// =========================================================================
// 4. Formativa 17: Saga Pattern Orchestrator & Immutable Event Store
// =========================================================================
Route::post('/saga/ordens', function (Request $request) {
    $controller = app(SagaAndEventSourcingController::class);
    foreach (['abrirOrdemViaSaga', 'executarSagaAbertura', 'executarSaga', 'iniciarSaga', 'store', '__invoke'] as $method) {
        if (method_exists($controller, $method)) {
            return app()->call([$controller, $method], ['request' => $request]);
        }
    }
    abort(501, 'Saga handler method not found on SagaAndEventSourcingController.');
})->name('api.saga.ordens');

Route::get('/event-store/{aggregateId}', function (Request $request, string $aggregateId) {
    $controller = app(SagaAndEventSourcingController::class);
    foreach (['replayAggregate', 'obterEventos', 'historicoEventos', 'replay', 'show', 'stream'] as $method) {
        if (method_exists($controller, $method)) {
            return app()->call([$controller, $method], [
                'request' => $request,
                'aggregateId' => $aggregateId,
                'id' => $aggregateId,
            ]);
        }
    }
    abort(501, 'Event store replay method not found on SagaAndEventSourcingController.');
})->name('api.event-store.replay');
