<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'NEXORA') - Field Service ERP</title>

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        nexora: {
                            navy: '#06265F',
                            blue: '#0B5FD7',
                            light: '#F8FAFC',
                            dark: '#0A192F',
                        }
                    }
                }
            }
        }
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #F8FAFC;
        }
    </style>
</head>
<body class="min-h-screen flex flex-col text-slate-800">

    <!-- Top Navigation Bar -->
    <header class="bg-[#06265F] text-white shadow-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Brand & Logo -->
                <div class="flex items-center gap-4">
                    <a href="{{ route('ordens.index') }}" class="flex items-center gap-3 group">
                        <div class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xl tracking-wider text-white shadow-md group-hover:bg-blue-500 transition">
                            NX
                        </div>
                        <div>
                            <span class="text-xl font-extrabold tracking-tight block">NEXORA</span>
                            <span class="text-[10px] text-blue-200 uppercase tracking-widest block font-semibold">Field Service ERP</span>
                        </div>
                    </a>
                    <span class="hidden md:inline-block bg-[#0B5FD7]/60 text-blue-100 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-blue-400/30">
                        MVC • SOLID • CQRS
                    </span>
                </div>

                <!-- Navigation Links -->
                <nav class="hidden md:flex items-center space-x-1">
                    <a href="{{ route('ordens.index') }}" class="px-3.5 py-2 rounded-lg text-sm font-medium transition {{ request()->routeIs('ordens.*') ? 'bg-[#0B5FD7] text-white shadow' : 'text-slate-200 hover:bg-white/10' }}">
                        📋 Gestão de OS
                    </a>
                    <a href="{{ route('dashboard') }}" class="px-3.5 py-2 rounded-lg text-sm font-medium transition {{ request()->routeIs('dashboard') ? 'bg-[#0B5FD7] text-white shadow' : 'text-slate-200 hover:bg-white/10' }}">
                        📊 Dashboard de KPIs
                    </a>
                    <a href="/api/bff/status" target="_blank" class="px-3.5 py-2 rounded-lg text-sm font-medium transition text-slate-200 hover:bg-white/10">
                        🛡️ Status Gateway BFF
                    </a>
                </nav>

                <!-- Academic Team Badge -->
                <div class="flex items-center gap-3">
                    <div class="hidden lg:flex flex-col text-right">
                        <span class="text-xs font-semibold text-slate-200">Equipe de Engenharia</span>
                        <span class="text-[10px] text-blue-300">5 Integrantes • Grupo NEXORA</span>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-sm font-bold text-blue-200" title="Éden Samuel, Fernando Lopes, Felipe Carneiro, Henrique Ricardo, Hugo Takeda">
                        👥
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Flash Messages Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
        @if (session('success'))
            <div class="flex items-center justify-between p-4 mb-4 text-sm font-medium text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="text-lg">✓</span>
                    <span>{{ session('success') }}</span>
                </div>
                <button type="button" onclick="this.parentElement.remove()" class="text-emerald-600 hover:text-emerald-900">&times;</button>
            </div>
        @endif

        @if (session('error'))
            <div class="flex items-center justify-between p-4 mb-4 text-sm font-medium text-rose-800 bg-rose-50 rounded-xl border border-rose-200 shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="text-lg">⚠</span>
                    <span>{{ session('error') }}</span>
                </div>
                <button type="button" onclick="this.parentElement.remove()" class="text-rose-600 hover:text-rose-900">&times;</button>
            </div>
        @endif

        @if ($errors->any())
            <div class="p-4 mb-4 text-sm font-medium text-rose-800 bg-rose-50 rounded-xl border border-rose-200 shadow-sm">
                <div class="flex items-center gap-2 mb-2 font-bold">
                    <span>⚠</span> Por favor, corrija os erros abaixo:
                </div>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
    </div>

    <!-- Main Content Slot -->
    <main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        @yield('content')
    </main>

    <!-- Executive Footer -->
    <footer class="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                <p class="font-bold text-slate-700">NEXORA Field Service ERP Ecosystem</p>
                <p>Arquitetura em Nuvem • Atividades Formativas 15, 16 & 17 • PHP 8.3 & Laravel 11</p>
            </div>
            <div class="text-center md:text-right">
                <p class="font-semibold text-slate-700">Integrantes do Grupo (GRUPO.md):</p>
                <p class="text-slate-600">Éden Samuel • Fernando Lopes • Felipe Carneiro • Henrique Ricardo • Hugo Takeda</p>
            </div>
        </div>
    </footer>

    @stack('scripts')
</body>
</html>
