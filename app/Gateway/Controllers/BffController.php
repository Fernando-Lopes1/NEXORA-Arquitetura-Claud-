<?php

namespace App\Gateway\Controllers;

use App\Gateway\Services\BffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

/**
 * Backend For Frontend (BFF) Controller (Formativa 16)
 *
 * Exposes specialized composition & aggregation endpoints at `/api/bff/**`:
 * - GET /api/bff/status
 * - GET /api/bff/dashboard
 * - GET /api/bff/ordens/{id}
 */
class BffController extends Controller
{
    public function __construct(
        private readonly BffService $bffService
    ) {
    }

    /**
     * GET /api/bff/status
     * Returns Gateway Fase 2 topology, active routes, CORS policy, and microservice health.
     */
    public function status(): JsonResponse
    {
        return response()->json($this->bffService->getArchitectureStatus(), 200);
    }

    /**
     * GET /api/bff/dashboard
     * Aggregates KPIs from Ordens Service (:8081) and Alocações Service (:8082) with resilient fallback.
     */
    public function dashboard(): JsonResponse
    {
        return response()->json($this->bffService->getConsolidatedDashboard(), 200);
    }

    /**
     * GET /api/bff/ordens/{id}
     * Vertical service composition combining Order details, Technician profile, SLA & financial metrics.
     */
    public function showOrdem(string $id): JsonResponse
    {
        $composition = $this->bffService->getOrderDetailsComposition($id);

        if ($composition === null) {
            return response()->json([
                'erro' => 'Ordem de Serviço não encontrada',
                'message' => "Ordem de Serviço '{$id}' não encontrada no serviço de domínio (:8081).",
                'codigo' => $id,
            ], 404);
        }

        return response()->json($composition, 200);
    }
}
