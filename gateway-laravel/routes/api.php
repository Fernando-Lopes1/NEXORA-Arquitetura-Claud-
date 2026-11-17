<?php

use App\Http\Controllers\BffController;
use App\Http\Controllers\GatewayProxyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — NEXORA API Gateway & BFF (Laravel 11)
|--------------------------------------------------------------------------
*/

// Health Check do Gateway
Route::get('/health', [BffController::class, 'health']);

// Endpoints Especializados do BFF (Backend For Frontend)
Route::prefix('bff')->group(function () {
    Route::get('/dashboard', [BffController::class, 'dashboard']);
    Route::get('/ordens-com-tecnicos', [BffController::class, 'ordensComTecnicos']);
    Route::get('/status', [BffController::class, 'status']);
});

// Proxy Reverso Transparente: os-service (Ordens de Serviço)
Route::any('/ordens/{any?}', [GatewayProxyController::class, 'proxyOrdens'])->where('any', '.*');

// Proxy Reverso Transparente: tecnicos-service (Técnicos de Campo)
Route::any('/tecnicos/{any?}', [GatewayProxyController::class, 'proxyTecnicos'])->where('any', '.*');
