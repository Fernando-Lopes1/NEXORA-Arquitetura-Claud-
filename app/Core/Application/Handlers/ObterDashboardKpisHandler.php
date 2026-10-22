<?php

declare(strict_types=1);

namespace App\Core\Application\Handlers;

use App\Core\Application\Contracts\OrdemServicoReaderInterface;
use App\Core\Application\Queries\ObterDashboardKpisQuery;
use App\Models\OrdemServico;
use App\Models\Tecnico;

/**
 * SRP & DIP: Query Handler for aggregating Executive Dashboard KPIs (CQRS Read Projection).
 */
final class ObterDashboardKpisHandler
{
    public function __construct(
        private readonly OrdemServicoReaderInterface $reader
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function handle(ObterDashboardKpisQuery $query): array
    {
        $ordens = $this->reader->listAll();

        $totalOrders = $ordens->count();
        $completedOrders = $ordens->where('situacao', OrdemServico::STATUS_CONCLUIDA)->count();
        $openOrders = $ordens->where('situacao', OrdemServico::STATUS_ABERTA)->count();
        $activeOrders = $ordens->whereIn('situacao', [
            OrdemServico::STATUS_ABERTA,
            OrdemServico::STATUS_AGENDADA,
            OrdemServico::STATUS_EM_EXECUCAO,
        ])->count();

        $totalValue = (float) $ordens->sum(fn (OrdemServico $o) => (float) $o->valor_estimado);
        $completionRate = $totalOrders > 0 ? (int) round(($completedOrders / $totalOrders) * 100) : 0;

        $statusCounts = [
            'Aberta' => $ordens->where('situacao', OrdemServico::STATUS_ABERTA)->count(),
            'Agendada' => $ordens->where('situacao', OrdemServico::STATUS_AGENDADA)->count(),
            'Em execução' => $ordens->where('situacao', OrdemServico::STATUS_EM_EXECUCAO)->count(),
            'Concluída' => $completedOrders,
            'Cancelada' => $ordens->where('situacao', OrdemServico::STATUS_CANCELADA)->count(),
        ];

        $priorityCounts = [
            'Urgente' => $ordens->where('prioridade', OrdemServico::PRIORIDADE_URGENTE)->count(),
            'Alta' => $ordens->where('prioridade', OrdemServico::PRIORIDADE_ALTA)->count(),
            'Média' => $ordens->where('prioridade', OrdemServico::PRIORIDADE_MEDIA)->count(),
            'Baixa' => $ordens->where('prioridade', OrdemServico::PRIORIDADE_BAIXA)->count(),
        ];

        $tecnicos = Tecnico::with('ordensServico')->get();
        $technicianWorkload = $tecnicos->map(function (Tecnico $tecnico) {
            $total = $tecnico->ordensServico->count();
            $valorTotal = (float) $tecnico->ordensServico->sum('valor_estimado');
            $ativas = $tecnico->ordensServico->whereIn('situacao', [
                OrdemServico::STATUS_AGENDADA,
                OrdemServico::STATUS_EM_EXECUCAO,
            ])->count();

            return [
                'id' => $tecnico->id,
                'nome' => $tecnico->nome,
                'especialidade' => $tecnico->especialidade,
                'total_ordens' => $total,
                'ordens_ativas' => $ativas,
                'valor_acumulado' => $valorTotal,
            ];
        })->sortByDesc('total_ordens')->values()->all();

        $pendentesAtribuicao = $ordens->filter(
            fn (OrdemServico $o) => $o->tecnico_id === null || $o->tecnico_nome === 'Não atribuído'
        )->count();

        $valorPendente = (float) $ordens->filter(
            fn (OrdemServico $o) => $o->tecnico_id === null || $o->tecnico_nome === 'Não atribuído'
        )->sum('valor_estimado');

        $ultimasOrdens = $ordens->take(5);

        return [
            // English keys required by M1 specification & unit tests
            'totalOrders' => $totalOrders,
            'completedOrders' => $completedOrders,
            'activeOrders' => $activeOrders,
            'openOrders' => $openOrders,
            'completionRate' => $completionRate,
            'totalValue' => $totalValue,
            'statusCounts' => $statusCounts,
            'priorityCounts' => $priorityCounts,
            'technicianWorkload' => $technicianWorkload,

            // Portuguese aliases for Blade Dashboard & BFF compatibility
            'totalOrdens' => $totalOrders,
            'ordensConcluidas' => $completedOrders,
            'ordensEmAndamento' => $activeOrders,
            'ordensAbertas' => $openOrders,
            'taxaConclusaoPercentual' => $completionRate,
            'volumeFinanceiroTotal' => $totalValue,
            'distribuicaoStatus' => $statusCounts,
            'prioridadeCounts' => $priorityCounts,
            'cargaTecnicos' => $technicianWorkload,
            'cargaPorTecnico' => $technicianWorkload,
            'pendentesAtribuicao' => $pendentesAtribuicao,
            'valorPendente' => $valorPendente,
            'ultimasOrdens' => $ultimasOrdens,
        ];
    }
}
