<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\Application\Commands\AtribuirTecnicoCommand;
use App\Core\Application\Commands\CancelarOrdemServicoCommand;
use App\Core\Application\Commands\ConcluirOrdemServicoCommand;
use App\Core\Application\Commands\CriarOrdemServicoCommand;
use App\Core\Application\Commands\ExcluirOrdemServicoCommand;
use App\Core\Application\Contracts\CommandBusInterface;
use App\Core\Application\Contracts\QueryBusInterface;
use App\Core\Application\Queries\ListarOrdensQuery;
use App\Core\Application\Queries\ObterOrdemPorIdQuery;
use App\Http\Requests\StoreOrdemServicoRequest;
use App\Models\OrdemServico;
use App\Models\Tecnico;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class OrdemServicoController extends Controller
{
    public function __construct(
        private readonly CommandBusInterface $commandBus,
        private readonly QueryBusInterface $queryBus
    ) {
    }

    public function index(Request $request): View
    {
        $statusFiltro = $request->query('status', 'Todos');
        $prioridadeFiltro = $request->query('prioridade', 'Todas');
        $termoBusca = $request->query('q') ?? $request->query('busca');
        $tecnicoId = $request->query('tecnico_id') ? (int) $request->query('tecnico_id') : null;

        $ordens = $this->queryBus->ask(new ListarOrdensQuery(
            status: $statusFiltro,
            prioridade: $prioridadeFiltro,
            tecnicoId: $tecnicoId,
            busca: $termoBusca
        ));

        $todasOrdens = $this->queryBus->ask(new ListarOrdensQuery());

        $contagens = [
            'total' => $todasOrdens->count(),
            'abertas' => $todasOrdens->where('situacao', OrdemServico::STATUS_ABERTA)->count(),
            'em_andamento' => $todasOrdens->whereIn('situacao', [
                OrdemServico::STATUS_AGENDADA,
                OrdemServico::STATUS_EM_EXECUCAO,
            ])->count(),
            'concluidas' => $todasOrdens->where('situacao', OrdemServico::STATUS_CONCLUIDA)->count(),
        ];

        $tecnicos = Tecnico::ativos()->orderBy('nome')->get();
        $proximoCodigo = 'OS-' . (((int) OrdemServico::max('id')) + 1001);

        return view('ordens.index', compact(
            'ordens',
            'tecnicos',
            'statusFiltro',
            'prioridadeFiltro',
            'termoBusca',
            'contagens',
            'proximoCodigo'
        ));
    }

    public function store(StoreOrdemServicoRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $valorEstimado = isset($validated['valor_estimado'])
            ? (float) $validated['valor_estimado']
            : (isset($validated['valorEstimado']) ? (float) $validated['valorEstimado'] : 0.0);

        $ordem = $this->commandBus->dispatch(new CriarOrdemServicoCommand(
            cliente: (string) $validated['cliente'],
            servico: (string) $validated['servico'],
            prioridade: (string) ($validated['prioridade'] ?? OrdemServico::PRIORIDADE_MEDIA),
            situacao: (string) ($validated['situacao'] ?? OrdemServico::STATUS_ABERTA),
            valorEstimado: $valorEstimado,
            tecnicoId: !empty($validated['tecnico_id']) ? (int) $validated['tecnico_id'] : null,
            tecnicoNome: $validated['tecnico'] ?? null,
            codigo: $validated['codigo'] ?? null,
            observacoes: $validated['observacoes'] ?? null,
            itens: $validated['itens'] ?? []
        ));

        return redirect()
            ->route('ordens.index')
            ->with('success', "Ordem de Serviço {$ordem->codigo} registrada com sucesso!");
    }

    public function show(int|string $codigo): View
    {
        /** @var ?OrdemServico $ordem */
        $ordem = $this->queryBus->ask(new ObterOrdemPorIdQuery($codigo));
        abort_unless($ordem !== null, 404, 'Ordem de Serviço não encontrada.');

        $tecnicos = Tecnico::ativos()->orderBy('nome')->get();

        $tempoDecorridoHoras = $ordem->created_at ? (int) $ordem->created_at->diffInHours(now()) : 0;
        $slaHoras = match ($ordem->prioridade) {
            OrdemServico::PRIORIDADE_URGENTE => 4,
            OrdemServico::PRIORIDADE_ALTA => 24,
            OrdemServico::PRIORIDADE_MEDIA => 48,
            default => 72,
        };
        $slaExcedido = ($ordem->situacao !== OrdemServico::STATUS_CONCLUIDA && $ordem->situacao !== OrdemServico::STATUS_CANCELADA)
            && ($tempoDecorridoHoras > $slaHoras);

        return view('ordens.show', compact('ordem', 'tecnicos', 'tempoDecorridoHoras', 'slaHoras', 'slaExcedido'));
    }

    public function assignTecnico(Request $request, int|string $codigo): RedirectResponse
    {
        $validated = $request->validate([
            'tecnico_id' => ['nullable', 'integer', 'exists:tecnicos,id'],
            'tecnico' => ['nullable', 'string'],
        ]);

        $ordem = $this->commandBus->dispatch(new AtribuirTecnicoCommand(
            ordemIdOuCodigo: $codigo,
            tecnicoId: !empty($validated['tecnico_id']) ? (int) $validated['tecnico_id'] : null,
            tecnicoNome: $validated['tecnico'] ?? null
        ));

        return redirect()
            ->back()
            ->with('success', "Técnico {$ordem->tecnico_nome} atribuído à OS {$ordem->codigo}!");
    }

    public function complete(Request $request, int|string $codigo): RedirectResponse
    {
        $valorFinal = $request->filled('valor_final') ? (float) $request->input('valor_final') : null;
        $observacoes = $request->input('observacoes');

        $ordem = $this->commandBus->dispatch(new ConcluirOrdemServicoCommand(
            ordemIdOuCodigo: $codigo,
            valorFinal: $valorFinal,
            observacoes: $observacoes
        ));

        return redirect()
            ->back()
            ->with('success', "Ordem de Serviço {$ordem->codigo} concluída com sucesso!");
    }

    public function cancel(Request $request, int|string $codigo): RedirectResponse
    {
        $motivo = $request->input('motivo', 'Cancelado pelo operador');

        $ordem = $this->commandBus->dispatch(new CancelarOrdemServicoCommand(
            ordemIdOuCodigo: $codigo,
            motivo: (string) $motivo
        ));

        return redirect()
            ->back()
            ->with('success', "Ordem de Serviço {$ordem->codigo} cancelada.");
    }

    public function destroy(int|string $codigo): RedirectResponse
    {
        $this->commandBus->dispatch(new ExcluirOrdemServicoCommand(
            ordemIdOuCodigo: $codigo
        ));

        return redirect()
            ->route('ordens.index')
            ->with('success', "Ordem de Serviço {$codigo} excluída com sucesso.");
    }
}
