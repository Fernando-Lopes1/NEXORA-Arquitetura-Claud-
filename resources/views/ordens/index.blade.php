@extends('layouts.app')

@section('title', 'Gestão de Ordens de Serviço')

@section('content')
<div class="space-y-6">

    <!-- Header & Quick Stats -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                📋 Módulo Operacional MVC + CQRS
            </div>
            <h1 class="text-2xl font-black text-[#06265F]">Gestão de Ordens de Serviço</h1>
            <p class="text-sm text-slate-500">Abertura, alocação de técnicos e acompanhamento do ciclo de vida de atendimentos de campo</p>
        </div>
        <div class="flex items-center gap-3">
            <a href="{{ route('dashboard') }}" class="inline-flex items-center gap-2 bg-[#0B5FD7] hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition">
                <span>📊</span> Ver KPIs Executivos
            </a>
        </div>
    </div>

    <!-- Quick Stat Badges -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <span class="text-xs font-semibold text-slate-500 uppercase">Total Geral</span>
                <p class="text-2xl font-black text-slate-800">{{ $contagens['total'] ?? $ordens->count() }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-50 text-[#0B5FD7] flex items-center justify-center font-bold text-lg">📄</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <span class="text-xs font-semibold text-sky-600 uppercase">Abertas</span>
                <p class="text-2xl font-black text-sky-600">{{ $contagens['abertas'] ?? 0 }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg">⏳</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <span class="text-xs font-semibold text-amber-600 uppercase">Em Andamento</span>
                <p class="text-2xl font-black text-amber-600">{{ $contagens['em_andamento'] ?? 0 }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">⚡</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <span class="text-xs font-semibold text-emerald-600 uppercase">Concluídas</span>
                <p class="text-2xl font-black text-emerald-600">{{ $contagens['concluidas'] ?? 0 }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">✓</div>
        </div>
    </div>

    <!-- Form to Create New Ordem de Serviço (Command Bus) -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
                <h2 class="text-base font-bold text-[#06265F]">➕ Abertura de Ordem de Serviço (OS)</h2>
                <p class="text-xs text-slate-500">Despacha <code class="bg-slate-100 px-1.5 py-0.5 rounded">CriarOrdemServicoCommand</code> via <code class="bg-slate-100 px-1.5 py-0.5 rounded">CommandBusInterface</code></p>
            </div>
            <span class="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">Próximo: {{ $proximoCodigo ?? 'OS-1006' }}</span>
        </div>

        <form method="POST" action="{{ route('ordens.store') }}" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            @csrf
            <div class="md:col-span-3">
                <label class="block text-xs font-bold text-slate-700 mb-1">Cliente *</label>
                <input type="text" name="cliente" value="{{ old('cliente') }}" placeholder="Ex: Hospital Central São Lucas" required class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="md:col-span-3">
                <label class="block text-xs font-bold text-slate-700 mb-1">Serviço Solicitado *</label>
                <input type="text" name="servico" value="{{ old('servico') }}" placeholder="Ex: Manutenção preventiva em gerador" required class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-700 mb-1">Técnico Responsável</label>
                <select name="tecnico_id" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Não atribuído</option>
                    @foreach ($tecnicos as $tec)
                        <option value="{{ $tec->id }}">{{ $tec->nome }}</option>
                    @endforeach
                </select>
            </div>

            <div class="md:col-span-1">
                <label class="block text-xs font-bold text-slate-700 mb-1">Prioridade</label>
                <select name="prioridade" class="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Baixa">Baixa</option>
                    <option value="Média" selected>Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                </select>
            </div>

            <div class="md:col-span-1">
                <label class="block text-xs font-bold text-slate-700 mb-1">Situação</label>
                <select name="situacao" class="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Aberta" selected>Aberta</option>
                    <option value="Agendada">Agendada</option>
                    <option value="Em execução">Em execução</option>
                </select>
            </div>

            <div class="md:col-span-1">
                <label class="block text-xs font-bold text-slate-700 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" name="valor_estimado" value="{{ old('valor_estimado', '450.00') }}" class="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="md:col-span-1">
                <button type="submit" class="w-full bg-[#0B5FD7] hover:bg-blue-700 text-white font-bold text-sm py-2 px-3 rounded-xl shadow-sm transition">
                    + Criar
                </button>
            </div>
        </form>
    </div>

    <!-- Filter & Search Controls (Query Bus) -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <form method="GET" action="{{ route('ordens.index') }}" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div class="md:col-span-5">
                <label class="block text-xs font-bold text-slate-600 mb-1">Buscar por Código, Cliente ou Técnico</label>
                <input type="text" name="q" value="{{ $termoBusca }}" placeholder="Ex: OS-1001, Hospital Central São Lucas, Henrique..." class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="md:col-span-3">
                <label class="block text-xs font-bold text-slate-600 mb-1">Situação / Status</label>
                <select name="status" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50">
                    <option value="Todos" {{ $statusFiltro === 'Todos' ? 'selected' : '' }}>Todos os Status</option>
                    <option value="Aberta" {{ $statusFiltro === 'Aberta' ? 'selected' : '' }}>Aberta</option>
                    <option value="Agendada" {{ $statusFiltro === 'Agendada' ? 'selected' : '' }}>Agendada</option>
                    <option value="Em execução" {{ $statusFiltro === 'Em execução' ? 'selected' : '' }}>Em execução</option>
                    <option value="Concluída" {{ $statusFiltro === 'Concluída' ? 'selected' : '' }}>Concluída</option>
                    <option value="Cancelada" {{ $statusFiltro === 'Cancelada' ? 'selected' : '' }}>Cancelada</option>
                </select>
            </div>

            <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-600 mb-1">Prioridade</label>
                <select name="prioridade" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50">
                    <option value="Todas" {{ $prioridadeFiltro === 'Todas' ? 'selected' : '' }}>Todas</option>
                    <option value="Urgente" {{ $prioridadeFiltro === 'Urgente' ? 'selected' : '' }}>Urgente</option>
                    <option value="Alta" {{ $prioridadeFiltro === 'Alta' ? 'selected' : '' }}>Alta</option>
                    <option value="Média" {{ $prioridadeFiltro === 'Média' ? 'selected' : '' }}>Média</option>
                    <option value="Baixa" {{ $prioridadeFiltro === 'Baixa' ? 'selected' : '' }}>Baixa</option>
                </select>
            </div>

            <div class="md:col-span-2 flex items-center gap-2">
                <button type="submit" class="w-full bg-[#06265F] hover:bg-slate-800 text-white font-semibold text-sm py-2 px-4 rounded-xl transition">
                    Filtrar
                </button>
                <a href="{{ route('ordens.index') }}" class="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-sm py-2 px-3 rounded-xl transition text-center" title="Limpar Filtros">
                    ✕
                </a>
            </div>
        </form>
    </div>

    <!-- Work Orders Data Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th class="py-3.5 px-4">Código</th>
                        <th class="py-3.5 px-4">Cliente</th>
                        <th class="py-3.5 px-4">Serviço Solicitado</th>
                        <th class="py-3.5 px-4">Técnico Responsável</th>
                        <th class="py-3.5 px-4">Prioridade</th>
                        <th class="py-3.5 px-4">Situação</th>
                        <th class="py-3.5 px-4 text-right">Valor Est. (R$)</th>
                        <th class="py-3.5 px-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-sm">
                    @forelse ($ordens as $ordem)
                        <tr class="hover:bg-blue-50/40 transition">
                            <td class="py-3.5 px-4 whitespace-nowrap font-bold text-[#06265F]">
                                <a href="{{ route('ordens.show', $ordem->codigo) }}" class="hover:underline font-mono">
                                    {{ $ordem->codigo }}
                                </a>
                            </td>
                            <td class="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                                {{ $ordem->cliente }}
                            </td>
                            <td class="py-3.5 px-4 text-slate-600 max-w-xs truncate" title="{{ $ordem->servico }}">
                                {{ $ordem->servico }}
                            </td>
                            <td class="py-3.5 px-4 whitespace-nowrap">
                                @if ($ordem->tecnico || ($ordem->tecnico_nome && $ordem->tecnico_nome !== 'Não atribuído'))
                                    <span class="inline-flex items-center gap-1.5 text-slate-800 font-medium">
                                        <span>👤</span> {{ $ordem->tecnico->nome ?? $ordem->tecnico_nome }}
                                    </span>
                                @else
                                    <span class="text-amber-600 font-medium text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        Não atribuído
                                    </span>
                                @endif
                            </td>
                            <td class="py-3.5 px-4 whitespace-nowrap">
                                @php
                                    $prioClasses = match($ordem->prioridade) {
                                        'Urgente' => 'bg-rose-100 text-rose-800 border-rose-200',
                                        'Alta' => 'bg-orange-100 text-orange-800 border-orange-200',
                                        'Média' => 'bg-blue-100 text-blue-800 border-blue-200',
                                        default => 'bg-slate-100 text-slate-700 border-slate-200',
                                    };
                                @endphp
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border {{ $prioClasses }}">
                                    {{ $ordem->prioridade }}
                                </span>
                            </td>
                            <td class="py-3.5 px-4 whitespace-nowrap">
                                @php
                                    $statusClasses = match($ordem->situacao) {
                                        'Aberta' => 'bg-sky-100 text-sky-800 border-sky-200',
                                        'Agendada' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
                                        'Em execução' => 'bg-amber-100 text-amber-800 border-amber-200',
                                        'Concluída' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
                                        'Cancelada' => 'bg-rose-100 text-rose-800 border-rose-200',
                                        default => 'bg-slate-100 text-slate-800 border-slate-200',
                                    };
                                @endphp
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border {{ $statusClasses }}">
                                    {{ $ordem->situacao }}
                                </span>
                            </td>
                            <td class="py-3.5 px-4 whitespace-nowrap text-right font-semibold text-slate-800">
                                R$ {{ number_format((float) $ordem->valor_estimado, 2, ',', '.') }}
                            </td>
                            <td class="py-3.5 px-4 whitespace-nowrap text-center">
                                <div class="inline-flex items-center gap-1.5">
                                    <a href="{{ route('ordens.show', $ordem->codigo) }}" class="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                                        Detalhes
                                    </a>
                                    @if ($ordem->situacao !== 'Concluída' && $ordem->situacao !== 'Cancelada')
                                        <form method="POST" action="{{ route('ordens.concluir', $ordem->codigo) }}" class="inline">
                                            @csrf
                                            @method('PATCH')
                                            <button type="submit" class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
                                                Concluir
                                            </button>
                                        </form>
                                    @endif
                                    <form method="POST" action="{{ route('ordens.destroy', $ordem->codigo) }}" class="inline">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition">
                                            Excluir
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="py-12 text-center text-slate-400">
                                Nenhuma Ordem de Serviço encontrada.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

</div>
@endsection
