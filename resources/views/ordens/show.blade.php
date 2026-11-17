@extends('layouts.app')

@section('title', 'Detalhes ' . $ordem->codigo)

@section('content')
<div class="space-y-6">

    <!-- Top Breadcrumb -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <a href="{{ route('ordens.index') }}" class="hover:underline">Ordens de Serviço</a>
            <span>/</span>
            <span class="text-slate-800">{{ $ordem->codigo }}</span>
        </div>
        <a href="{{ route('ordens.index') }}" class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition">
            ← Voltar para listagem
        </a>
    </div>

    <!-- Main Order Header -->
    <div class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
            <div class="flex items-center gap-3 mb-2">
                <h1 class="text-3xl font-black text-[#06265F] font-mono">{{ $ordem->codigo }}</h1>
                <span class="px-3 py-1 rounded-full text-xs font-bold border bg-blue-50 text-blue-800 border-blue-200">
                    Prioridade: {{ $ordem->prioridade }}
                </span>
                <span class="px-3 py-1 rounded-full text-xs font-black border bg-emerald-50 text-emerald-800 border-emerald-200">
                    Status: {{ $ordem->situacao }}
                </span>
            </div>
            <p class="text-lg font-bold text-slate-800">{{ $ordem->cliente }}</p>
            <p class="text-sm text-slate-500 mt-1">{{ $ordem->servico }}</p>
        </div>

        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right min-w-[200px]">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Valor Estimado</span>
            <span class="text-2xl font-black text-[#06265F] block">R$ {{ number_format((float) $ordem->valor_estimado, 2, ',', '.') }}</span>
            @if ($ordem->valor_final)
                <span class="text-xs font-bold text-emerald-600 block mt-1">Valor Final: R$ {{ number_format((float) $ordem->valor_final, 2, ',', '.') }}</span>
            @endif
        </div>
    </div>

    <!-- 2-Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            <!-- Items Table -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-base font-bold text-[#06265F]">🔧 Peças & Serviços Alocados</h2>
                    <span class="text-xs font-semibold text-slate-500">{{ $ordem->itens->count() }} itens</span>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                                <th class="py-2.5 px-3">Descrição</th>
                                <th class="py-2.5 px-3 text-center">Qtd</th>
                                <th class="py-2.5 px-3 text-right">Unitário (R$)</th>
                                <th class="py-2.5 px-3 text-right">Total (R$)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            @forelse ($ordem->itens as $item)
                                <tr>
                                    <td class="py-3 px-3 font-medium text-slate-800">{{ $item->descricao }}</td>
                                    <td class="py-3 px-3 text-center text-slate-600">{{ $item->quantidade }}</td>
                                    <td class="py-3 px-3 text-right text-slate-600">R$ {{ number_format((float) $item->valor_unitario, 2, ',', '.') }}</td>
                                    <td class="py-3 px-3 text-right font-bold text-slate-900">R$ {{ number_format((float) $item->valor_total, 2, ',', '.') }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="py-6 text-center text-slate-400 text-xs">
                                        Escopo consolidado no valor principal da Ordem de Serviço.
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SLA & Timeline -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 class="text-base font-bold text-[#06265F]">⏱️ Indicadores de SLA & Observações</h2>
                <p class="text-xs text-slate-600">Meta SLA: <strong>{{ $slaHoras }} horas</strong> | Tempo decorrido: <strong>{{ $tempoDecorridoHoras }} horas</strong></p>
                @if ($ordem->observacoes)
                    <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 whitespace-pre-line">
                        {{ $ordem->observacoes }}
                    </div>
                @endif
            </div>
        </div>

        <!-- Technician Assignment & Lifecycle Actions -->
        <div class="space-y-6">
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 class="text-sm font-bold text-slate-700 uppercase">👤 Técnico Responsável</h3>
                <p class="text-sm font-bold text-[#06265F]">{{ $ordem->tecnico->nome ?? $ordem->tecnico_nome ?? 'Não atribuído' }}</p>

                <form method="POST" action="{{ route('ordens.atribuir', $ordem->codigo) }}" class="space-y-3 pt-2">
                    @csrf
                    <label class="block text-xs font-bold text-slate-600">Atribuir / Alterar Técnico:</label>
                    <div class="flex gap-2">
                        <select name="tecnico_id" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50">
                            @foreach ($tecnicos as $tec)
                                <option value="{{ $tec->id }}" {{ $ordem->tecnico_id == $tec->id ? 'selected' : '' }}>
                                    {{ $tec->nome }}
                                </option>
                            @endforeach
                        </select>
                        <button type="submit" class="px-3 py-2 bg-[#06265F] text-white font-semibold text-xs rounded-xl">
                            Alocar
                        </button>
                    </div>
                </form>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 class="text-sm font-bold text-slate-700 uppercase">⚡ Ações Operacionais</h3>
                @if ($ordem->situacao !== 'Concluída' && $ordem->situacao !== 'Cancelada')
                    <form method="POST" action="{{ route('ordens.concluir', $ordem->codigo) }}">
                        @csrf
                        @method('PATCH')
                        <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition">
                            ✓ Concluir Ordem de Serviço
                        </button>
                    </form>
                    <form method="POST" action="{{ route('ordens.cancelar', $ordem->codigo) }}">
                        @csrf
                        @method('PATCH')
                        <button type="submit" class="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs py-2 px-4 rounded-xl transition">
                            ✕ Cancelar Ordem de Serviço
                        </button>
                    </form>
                @endif
            </div>
        </div>
    </div>

</div>
@endsection
