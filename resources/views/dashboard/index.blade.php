@extends('layouts.app')

@section('title', 'Dashboard Executivo de KPIs')

@section('content')
<div class="space-y-6">

    <!-- Top Executive Banner -->
    <div class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06265F] text-white text-[11px] font-black uppercase tracking-wider mb-2">
                📊 CQRS Read Model • Dashboard Executivo
            </div>
            <h1 class="text-2xl font-black text-[#06265F]">Painel de Indicadores &amp; Performance (KPIs)</h1>
            <p class="text-sm text-slate-500">Módulo analítico executivo em tempo real • Consolidação dos Domínios NEXORA</p>
        </div>
        <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                QueryBus: ObterDashboardKpisQuery
            </span>
        </div>
    </div>

    <!-- 4 High-Impact KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-black">📋</div>
            <div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total de Ordens</span>
                <h3 class="text-3xl font-black text-slate-900">{{ $kpis['totalOrders'] ?? $kpis['totalOrdens'] ?? 0 }}</h3>
                <span class="text-xs text-slate-500">Atendimentos mapeados</span>
            </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-black">✓</div>
            <div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Taxa de Conclusão</span>
                <h3 class="text-3xl font-black text-emerald-600">{{ $kpis['completionRate'] ?? $kpis['taxaConclusaoPercentual'] ?? 0 }}%</h3>
                <span class="text-xs text-slate-500">{{ $kpis['completedOrders'] ?? $kpis['ordensConcluidas'] ?? 0 }} OS finalizadas</span>
            </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-black">⚡</div>
            <div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Em Andamento</span>
                <h3 class="text-3xl font-black text-amber-600">{{ $kpis['activeOrders'] ?? $kpis['ordensEmAndamento'] ?? 0 }}</h3>
                <span class="text-xs text-slate-500">OS abertas e em campo</span>
            </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl font-black">💰</div>
            <div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Volume Estimado</span>
                <h3 class="text-2xl font-black text-[#06265F]">
                    R$ {{ number_format((float) ($kpis['totalValue'] ?? $kpis['volumeFinanceiroTotal'] ?? 0), 2, ',', '.') }}
                </h3>
                <span class="text-xs text-slate-500">Volume financeiro total</span>
            </div>
        </div>
    </div>

    <!-- 2 Distribution Visual Progress Bars -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Status Breakdown Card -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
                <h4 class="text-base font-bold text-[#06265F]">📌 Status dos Atendimentos</h4>
                <span class="text-xs font-semibold text-slate-400">{{ $kpis['totalOrders'] ?? 0 }} registros</span>
            </div>

            <div class="space-y-3.5">
                @php
                    $statusColors = [
                        'Aberta' => '#0284C7',
                        'Agendada' => '#4F46E5',
                        'Em execução' => '#D97706',
                        'Concluída' => '#16A34A',
                        'Cancelada' => '#DC2626',
                    ];
                    $totalOrd = max(1, (int) ($kpis['totalOrders'] ?? 1));
                @endphp
                @foreach (($kpis['statusCounts'] ?? []) as $status => $count)
                    @php
                        $pct = ($kpis['totalOrders'] ?? 0) > 0 ? round(($count / $totalOrd) * 100) : 0;
                        $cor = $statusColors[$status] ?? '#64748B';
                    @endphp
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{{ $status }}</span>
                            <span class="text-slate-500">{{ $count }} ({{ $pct }}%)</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full rounded-full" style="width: {{ $pct }}%; background-color: {{ $cor }};"></div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>

        <!-- Priority Breakdown Card -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
                <h4 class="text-base font-bold text-[#06265F]">🎯 Nível de Prioridade</h4>
                <span class="text-xs font-semibold text-slate-400">Distribuição de Criticidade</span>
            </div>

            <div class="space-y-3.5">
                @php
                    $priorityColors = [
                        'Urgente' => '#DC2626',
                        'Alta' => '#EA580C',
                        'Média' => '#2563EB',
                        'Baixa' => '#64748B',
                    ];
                @endphp
                @foreach (($kpis['priorityCounts'] ?? $kpis['prioridadeCounts'] ?? []) as $prio => $count)
                    @php
                        $pct = ($kpis['totalOrders'] ?? 0) > 0 ? round(($count / $totalOrd) * 100) : 0;
                        $cor = $priorityColors[$prio] ?? '#64748B';
                    @endphp
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{{ $prio }}</span>
                            <span class="text-slate-500">{{ $count }} ({{ $pct }}%)</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full rounded-full" style="width: {{ $pct }}%; background-color: {{ $cor }};"></div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    <!-- Technician Workload Table -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
            <h4 class="text-base font-bold text-[#06265F]">👥 Carga de Trabalho por Técnico de Campo</h4>
            <p class="text-xs text-slate-500">Distribuição de chamados e volume financeiro alocado aos engenheiros e técnicos do grupo</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @foreach (($kpis['technicianWorkload'] ?? $kpis['cargaTecnicos'] ?? []) as $tec)
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-[#06265F] text-white flex items-center justify-center font-bold text-sm">
                            {{ substr($tec['nome'], 0, 2) }}
                        </div>
                        <div>
                            <h5 class="text-sm font-bold text-slate-900">{{ $tec['nome'] }}</h5>
                            <span class="text-[11px] text-slate-500 block truncate max-w-[180px]">{{ $tec['especialidade'] }}</span>
                            <span class="text-[11px] font-semibold text-blue-600">
                                {{ $tec['total_ordens'] }} {{ $tec['total_ordens'] == 1 ? 'OS atribuída' : 'OS atribuídas' }}
                            </span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-bold text-[#06265F] block">
                            R$ {{ number_format((float) $tec['valor_acumulado'], 2, ',', '.') }}
                        </span>
                        <span class="text-[10px] text-slate-400 uppercase font-semibold">Alocado</span>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

</div>
@endsection
