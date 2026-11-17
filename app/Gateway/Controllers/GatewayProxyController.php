<?php

namespace App\Gateway\Controllers;

use App\Gateway\Middleware\CorrelationIdMiddleware;
use App\Gateway\Services\BffService;
use App\Models\OrdemServico;
use App\Models\Tecnico;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * API Gateway Reverse Proxy Controller (Formativa 16)
 *
 * Implements transparent routing for:
 * - Domínio 1 (Ordens de Serviço -> :8081 / ordens-service):
 *   - GET    /api/ordens
 *   - GET    /api/ordens/{id}
 *   - POST   /api/ordens
 *   - PUT    /api/ordens/{id}
 *   - PATCH  /api/ordens/{id}/concluir
 *   - DELETE /api/ordens/{id}
 * - Domínio 2 (Técnicos, Alocações & Dashboard -> :8082 / alocacoes-service):
 *   - GET    /api/alocacoes
 *   - POST   /api/alocacoes/{ordemId}/atribuir
 *   - GET    /api/dashboard/kpis
 */
class GatewayProxyController extends Controller
{
    public function __construct(
        private readonly BffService $bffService
    ) {
    }

    /**
     * GET /api/ordens
     */
    public function listarOrdens(Request $request): JsonResponse
    {
        if ($forwarded = $this->tryForwardUpstream($request, 'ordens_service', '/api/ordens')) {
            return $forwarded;
        }

        $status = $request->query('situacao', $request->query('status'));
        $prioridade = $request->query('prioridade');

        $ordens = OrdemServico::with(['tecnico', 'itens'])
            ->porStatus($status)
            ->porPrioridade($prioridade)
            ->orderByDesc('id')
            ->get()
            ->map(fn (OrdemServico $os) => $this->formatOrdem($os))
            ->values()
            ->all();

        return response()->json([
            'servico' => 'ordens-service',
            'porta_origem' => 8081,
            'total' => count($ordens),
            'ordens' => $ordens,
            'data' => $ordens,
        ], 200);
    }

    /**
     * GET /api/ordens/{id}
     */
    public function obterOrdem(Request $request, string $id): JsonResponse
    {
        if ($forwarded = $this->tryForwardUpstream($request, 'ordens_service', "/api/ordens/{$id}")) {
            return $forwarded;
        }

        $ordem = $this->findOrdem($id);

        if (!$ordem) {
            return response()->json([
                'erro' => 'Ordem de Serviço não encontrada',
                'codigo' => $id,
            ], 404);
        }

        return response()->json($this->formatOrdem($ordem), 200);
    }

    /**
     * POST /api/ordens
     */
    public function criarOrdem(Request $request): JsonResponse
    {
        if ($forwarded = $this->tryForwardUpstream($request, 'ordens_service', '/api/ordens')) {
            return $forwarded;
        }

        $validated = $request->validate([
            'codigo' => 'nullable|string|max:50',
            'cliente' => 'required|string|max:255',
            'servico' => 'nullable|string|max:2000',
            'tipoServico' => 'nullable|string|max:2000',
            'tecnico_id' => 'nullable|integer',
            'tecnico_nome' => 'nullable|string|max:255',
            'tecnico' => 'nullable|string|max:255',
            'prioridade' => 'nullable|string|in:Baixa,Média,Media,Alta,Urgente',
            'situacao' => 'nullable|string|in:Aberta,Agendada,Em execução,Concluída,Cancelada',
            'valor_estimado' => 'nullable|numeric|min:0',
            'valorEstimado' => 'nullable|numeric|min:0',
            'observacoes' => 'nullable|string|max:2000',
        ]);

        $codigo = $validated['codigo'] ?? $this->generateNextOrderCode();
        $servicoDesc = $validated['servico'] ?? $validated['tipoServico'] ?? 'Manutenção técnica de campo';
        $prioridade = $validated['prioridade'] ?? OrdemServico::PRIORIDADE_MEDIA;
        if ($prioridade === 'Media') {
            $prioridade = OrdemServico::PRIORIDADE_MEDIA;
        }

        $valorEstimado = (float) ($validated['valor_estimado'] ?? $validated['valorEstimado'] ?? 0.00);
        $tecnicoId = $validated['tecnico_id'] ?? null;
        $tecnicoNome = $validated['tecnico_nome'] ?? $validated['tecnico'] ?? 'Não atribuído';

        if ($tecnicoId && (!$tecnicoNome || $tecnicoNome === 'Não atribuído')) {
            $tec = Tecnico::find($tecnicoId);
            if ($tec) {
                $tecnicoNome = $tec->nome;
            }
        }

        $situacao = $validated['situacao'] ?? ($tecnicoId ? OrdemServico::STATUS_AGENDADA : OrdemServico::STATUS_ABERTA);

        $ordem = OrdemServico::create([
            'codigo' => $codigo,
            'cliente' => $validated['cliente'],
            'servico' => $servicoDesc,
            'tecnico_id' => $tecnicoId,
            'tecnico_nome' => $tecnicoNome,
            'prioridade' => $prioridade,
            'situacao' => $situacao,
            'valor_estimado' => $valorEstimado,
            'observacoes' => $validated['observacoes'] ?? null,
            'data_agendamento' => $tecnicoId ? now() : null,
        ]);

        return response()->json($this->formatOrdem($ordem->fresh(['tecnico', 'itens'])), 201);
    }

    /**
     * PUT /api/ordens/{id}
     */
    public function atualizarOrdem(Request $request, string $id): JsonResponse
    {
        if ($forwarded = $this->tryForwardUpstream($request, 'ordens_service', "/api/ordens/{$id}")) {
            return $forwarded;
        }

        $ordem = $this->findOrdem($id);

        if (!$ordem) {
            return response()->json([
                'erro' => 'Ordem de Serviço não encontrada',
                'codigo' => $id,
            ], 404);
        }

        $validated = $request->validate([
            'cliente' => 'sometimes|string|max:255',
            'servico' => 'sometimes|string|max:2000',
            'prioridade' => 'sometimes|string|in:Baixa,Média,Media,Alta,Urgente',
            'situacao' => 'sometimes|string|in:Aberta,Agendada,Em execução,Concluída,Cancelada',
            'valor_estimado' => 'sometimes|numeric|min:0',
            'valorEstimado' => 'sometimes|numeric|min:0',
            'valor_final' => 'nullable|numeric|min:0',
            'observacoes' => 'nullable|string|max:2000',
            'tecnico_id' => 'nullable|integer',
            'tecnico_nome' => 'nullable|string|max:255',
        ]);

        if (isset($validated['valorEstimado']) && !isset($validated['valor_estimado'])) {
            $validated['valor_estimado'] = $validated['valorEstimado'];
            unset($validated['valorEstimado']);
        }

        if (isset($validated['prioridade']) && $validated['prioridade'] === 'Media') {
            $validated['prioridade'] = OrdemServico::PRIORIDADE_MEDIA;
        }

        $ordem->fill($validated);
        $ordem->save();

        return response()->json($this->formatOrdem($ordem->fresh(['tecnico', 'itens'])), 200);
    }

    /**
     * PATCH /api/ordens/{id}/concluir
     */
    public function concluirOrdem(Request $request, string $id): JsonResponse
    {
        if ($forwarded = $this->tryForwardUpstream($request, 'ordens_service', "/api/ordens/{$id}/concluir")) {
            return $forwarded;
        }

        $ordem = $this->findOrdem($id);

        if (!$ordem) {
            return response()->json([
                'erro' => 'Ordem de Serviço não encontrada',
                'codigo' => $id,
            ], 404);
        }

        $valorFinal = $request->has('valor_final')
            ? (float) $request->input('valor_final')
            : ($request->has('valorFinal') ? (float) $request->input('valorFinal') : null);

        $ordem->concluir($valorFinal);

        return response()->json($this->formatOrdem($ordem->fresh(['tecnico', 'itens'])), 200);
    }

    /**
     * DELETE /api/ordens/{id}
     */
    public function excluirOrdem(Request $request, string $id): JsonResponse
    {
        if ($forwarded = $this->tryForwardUpstream($request, 'ordens_service', "/api/ordens/{$id}")) {
            return $forwarded;
        }

        $ordem = $this->findOrdem($id);

        if (!$ordem) {
            return response()->json([
                'erro' => 'Ordem de Serviço não encontrada',
                'codigo' => $id,
            ], 404);
        }

        $codigo = $ordem->codigo;
        $ordem->delete();

        return response()->json([
            'removido' => true,
            'codigo' => $codigo,
            'mensagem' => "Ordem de Serviço {$codigo} removida com sucesso via API Gateway.",
        ], 200);
    }

    /**
     * GET /api/alocacoes
     */
    public function listarAlocacoes(Request $request): JsonResponse
    {
        if ($forwarded = $this->tryForwardUpstream($request, 'alocacoes_service', '/api/alocacoes')) {
            return $forwarded;
        }

        $tecnicos = Tecnico::withCount([
            'ordensServico as ordens_ativas_count' => function ($query) {
                $query->whereIn('situacao', [
                    OrdemServico::STATUS_ABERTA,
                    OrdemServico::STATUS_AGENDADA,
                    OrdemServico::STATUS_EM_EXECUCAO,
                ]);
            },
            'ordensServico as total_ordens_count',
        ])->get()->map(fn (Tecnico $t) => [
            'id' => $t->id,
            'codigo' => 'TEC-' . str_pad((string) $t->id, 3, '0', STR_PAD_LEFT),
            'nome' => $t->nome,
            'email' => $t->email,
            'telefone' => $t->telefone,
            'especialidade' => $t->especialidade,
            'ativo' => (bool) $t->ativo,
            'ordensAtivas' => (int) ($t->ordens_ativas_count ?? 0),
            'totalOrdens' => (int) ($t->total_ordens_count ?? 0),
        ])->values()->all();

        return response()->json([
            'servico' => 'alocacoes-service',
            'porta_origem' => 8082,
            'totalTecnicos' => count($tecnicos),
            'alocacoes' => $tecnicos,
            'data' => $tecnicos,
        ], 200);
    }

    /**
     * POST /api/alocacoes/{ordemId}/atribuir
     */
    public function atribuirTecnico(Request $request, string $ordemId): JsonResponse
    {
        if ($forwarded = $this->tryForwardUpstream($request, 'alocacoes_service', "/api/alocacoes/{$ordemId}/atribuir")) {
            return $forwarded;
        }

        $ordem = $this->findOrdem($ordemId);

        if (!$ordem) {
            return response()->json([
                'erro' => 'Ordem de Serviço não encontrada para alocação',
                'codigo' => $ordemId,
            ], 404);
        }

        $validated = $request->validate([
            'tecnico_id' => 'required|integer|exists:tecnicos,id',
        ]);

        $tecnico = Tecnico::findOrFail((int) $validated['tecnico_id']);
        $ordem->atribuirTecnico($tecnico);

        return response()->json([
            'servico' => 'alocacoes-service',
            'alocado' => true,
            'ordem' => $this->formatOrdem($ordem->fresh(['tecnico', 'itens'])),
            'tecnico' => [
                'id' => $tecnico->id,
                'nome' => $tecnico->nome,
                'especialidade' => $tecnico->especialidade,
            ],
        ], 200);
    }

    /**
     * GET /api/dashboard/kpis
     */
    public function obterKpisDashboard(Request $request): JsonResponse
    {
        if ($forwarded = $this->tryForwardUpstream($request, 'alocacoes_service', '/api/dashboard/kpis')) {
            return $forwarded;
        }

        return response()->json($this->bffService->getConsolidatedDashboard(), 200);
    }

    private function findOrdem(string $idOrCodigo): ?OrdemServico
    {
        $query = OrdemServico::with(['tecnico', 'itens']);

        if (is_numeric($idOrCodigo)) {
            $found = (clone $query)->find((int) $idOrCodigo);
            if ($found) {
                return $found;
            }
        }

        return $query->where('codigo', $idOrCodigo)->first();
    }

    private function formatOrdem(OrdemServico $os): array
    {
        return [
            'id' => $os->id,
            'codigo' => $os->codigo,
            'cliente' => $os->cliente,
            'servico' => $os->servico,
            'tecnico_id' => $os->tecnico_id,
            'tecnico_nome' => $os->tecnico?->nome ?? $os->tecnico_nome ?? 'Não atribuído',
            'tecnico' => $os->tecnico?->nome ?? $os->tecnico_nome ?? 'Não atribuído',
            'prioridade' => $os->prioridade,
            'situacao' => $os->situacao,
            'status' => $os->situacao,
            'valor_estimado' => (float) $os->valor_estimado,
            'valorEstimado' => (float) $os->valor_estimado,
            'valor_final' => $os->valor_final !== null ? (float) $os->valor_final : null,
            'observacoes' => $os->observacoes,
            'data_agendamento' => $os->data_agendamento?->toIso8601String(),
            'data_conclusao' => $os->data_conclusao?->toIso8601String(),
            'created_at' => ($os->created_at ?? now())->toIso8601String(),
        ];
    }

    private function generateNextOrderCode(): string
    {
        $maxId = (int) OrdemServico::max('id');
        $nextNumber = 1001 + $maxId;

        while (OrdemServico::where('codigo', "OS-{$nextNumber}")->exists()) {
            $nextNumber++;
        }

        return "OS-{$nextNumber}";
    }

    /**
     * Optional transparent HTTP forwarding to external microservice instances (:8081 / :8082)
     * when `gateway.upstreams.<service>.forward_http` is enabled.
     */
    private function tryForwardUpstream(Request $request, string $upstreamKey, string $targetPath): ?JsonResponse
    {
        if (!config("gateway.upstreams.{$upstreamKey}.forward_http", false)) {
            return null;
        }

        $baseUrl = rtrim((string) config("gateway.upstreams.{$upstreamKey}.url", ''), '/');
        if ($baseUrl === '') {
            return null;
        }

        try {
            $correlationId = (string) $request->header(CorrelationIdMiddleware::HEADER_NAME, '');
            $timeout = (int) config("gateway.upstreams.{$upstreamKey}.timeout_seconds", 5);

            $response = Http::timeout($timeout)
                ->withHeaders([
                    CorrelationIdMiddleware::HEADER_NAME => $correlationId,
                    'Accept' => 'application/json',
                ])
                ->send($request->method(), $baseUrl . $targetPath, [
                    'query' => $request->query(),
                    'json' => $request->all(),
                ]);

            return response()->json($response->json() ?? [], $response->status());
        } catch (Throwable) {
            return null;
        }
    }
}
