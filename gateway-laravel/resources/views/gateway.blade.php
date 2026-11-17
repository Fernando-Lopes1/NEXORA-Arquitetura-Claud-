<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXORA — API Gateway & BFF (Laravel)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Plus Jakarta Sans', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    colors: {
                        brand: {
                            50: '#f0fdf4',
                            500: '#10b981',
                            600: '#059669',
                            900: '#064e3b',
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-emerald-500 selection:text-slate-950">

    <!-- Header / Navbar -->
    <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20 text-lg">
                    ⚡
                </div>
                <div>
                    <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        NEXORA Gateway & BFF
                        <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Fase 2 • PHP/Laravel
                        </span>
                    </h1>
                    <p class="text-xs text-slate-400">Camada Centralizada de Interface do Backend (Arquitetura em Nuvem)</p>
                </div>
            </div>

            <!-- Badges e Links -->
            <div class="flex items-center gap-3">
                <a href="/api/health" target="_blank" class="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    GET /api/health
                </a>
                <a href="/api/bff/status" target="_blank" class="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition">
                    GET /api/bff/status
                </a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">

        <!-- Banner Explicativo Pedagógico: Antes vs Depois -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-slate-900/40 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-red-400 font-bold text-sm">❌ FASE 1: ACESSO DIRETO (Marco Zero)</span>
                </div>
                <ul class="text-xs text-slate-400 space-y-2 list-disc list-inside">
                    <li>Frontend acessa diretamente múltiplos hosts e portas (:8081, :8082).</li>
                    <li>CORS configurado e fragmentado em cada microsserviço isoladamente.</li>
                    <li><strong>Chatty I/O:</strong> O cliente precisa disparar múltiplas requisições sequenciais.</li>
                    <li>Qualquer mudança de porta ou IP downstream quebra as telas do usuário.</li>
                </ul>
            </div>

            <div class="bg-slate-900/40 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-emerald-500/5">
                <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-emerald-400 font-bold text-sm">✅ FASE 2: API GATEWAY & BFF CENTRALIZADO</span>
                </div>
                <ul class="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li><strong>Ponto Único de Entrada:</strong> Frontend conhece apenas a URL deste Gateway.</li>
                    <li><strong>BFF Concorrente:</strong> Agregação em paralelo via <code class="text-emerald-400 font-mono">Http::pool</code> do Laravel.</li>
                    <li><strong>Observabilidade:</strong> Injeção dos headers <code class="text-emerald-400 font-mono">X-Correlation-Id</code> e latência.</li>
                    <li><strong>Microsserviços Intactos:</strong> Nenhuma linha alterada nos serviços de domínio.</li>
                </ul>
            </div>
        </div>

        <!-- Integrantes do Grupo -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                👥 Integrantes do Grupo (GRUPO.md)
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <div class="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                    <div class="text-sm font-bold text-white">Éden Samuel</div>
                    <div class="text-[11px] text-emerald-400">Desenvolvedor</div>
                </div>
                <div class="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                    <div class="text-sm font-bold text-white">Fernando Lopes</div>
                    <div class="text-[11px] text-emerald-400">Desenvolvedor</div>
                </div>
                <div class="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                    <div class="text-sm font-bold text-white">Felipe Carneiro</div>
                    <div class="text-[11px] text-emerald-400">Desenvolvedor</div>
                </div>
                <div class="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                    <div class="text-sm font-bold text-white">Henrique Ricardo</div>
                    <div class="text-[11px] text-emerald-400">Desenvolvedor</div>
                </div>
                <div class="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                    <div class="text-sm font-bold text-white">Hugo Takeda</div>
                    <div class="text-[11px] text-emerald-400">Desenvolvedor</div>
                </div>
            </div>
        </div>

        <!-- Console Interativo de Teste de Endpoints -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                    🧪 Console Interativo de Requisições
                </h3>
                <p class="text-xs text-slate-400">Clique em qualquer endpoint abaixo para disparar a chamada real através do Gateway / BFF e inspecionar o payload e headers retornados.</p>
            </div>

            <!-- Botões de Ação Rápida -->
            <div class="flex flex-wrap gap-2.5">
                <button onclick="testRoute('/api/bff/dashboard', 'GET')" class="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold transition">
                    GET /api/bff/dashboard (BFF Concorrente)
                </button>
                <button onclick="testRoute('/api/bff/ordens-com-tecnicos', 'GET')" class="px-3.5 py-2 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-mono font-semibold transition">
                    GET /api/bff/ordens-com-tecnicos (BFF Composição)
                </button>
                <button onclick="testRoute('/api/ordens', 'GET')" class="px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-mono font-semibold transition">
                    GET /api/ordens (Proxy Reverso OS)
                </button>
                <button onclick="testRoute('/api/tecnicos', 'GET')" class="px-3.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-semibold transition">
                    GET /api/tecnicos (Proxy Reverso Técnicos)
                </button>
                <button onclick="testRoute('/api/bff/status', 'GET')" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition">
                    GET /api/bff/status
                </button>
                <button onclick="testRoute('/api/health', 'GET')" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition">
                    GET /api/health
                </button>
            </div>

            <!-- Painel de Saída -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- Headers de Rastreabilidade -->
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cabeçalhos HTTP (Gateway)</div>
                    <div><span class="text-slate-500">Status:</span> <span id="res-status" class="text-emerald-400 font-bold">—</span></div>
                    <div><span class="text-slate-500">X-Correlation-Id:</span> <span id="res-correlation" class="text-amber-400 break-all">—</span></div>
                    <div><span class="text-slate-500">X-Gateway-Route:</span> <span id="res-route" class="text-cyan-400">—</span></div>
                    <div><span class="text-slate-500">Latência:</span> <span id="res-latency" class="text-purple-400">—</span></div>
                </div>

                <!-- Resposta JSON -->
                <div class="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-96">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Corpo da Resposta (JSON)</span>
                        <span id="target-url-label" class="text-slate-500 normal-case font-normal">Nenhuma requisição executada</span>
                    </div>
                    <pre id="res-body" class="text-slate-300 whitespace-pre-wrap">// Clique em um dos botões acima para testar ao vivo</pre>
                </div>
            </div>
        </div>

    </main>

    <footer class="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        NEXORA Field Service ERP • Disciplina de Arquitetura de Soluções / Software • Azure Web App (PHP 8.2 Laravel 11)
    </footer>

    <script>
        async function testRoute(url, method) {
            const bodyEl = document.getElementById('res-body');
            const statusEl = document.getElementById('res-status');
            const corrEl = document.getElementById('res-correlation');
            const routeEl = document.getElementById('res-route');
            const latencyEl = document.getElementById('res-latency');
            const urlLabel = document.getElementById('target-url-label');

            urlLabel.textContent = `${method} ${url}`;
            bodyEl.textContent = 'Carregando...';

            const start = performance.now();
            try {
                const res = await fetch(url, { method });
                const end = performance.now();

                statusEl.textContent = `${res.status} ${res.statusText}`;
                statusEl.className = res.ok ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold';

                corrEl.textContent = res.headers.get('X-Correlation-Id') || 'N/A';
                routeEl.textContent = res.headers.get('X-Gateway-Route') || 'N/A';
                latencyEl.textContent = `${(res.headers.get('X-Gateway-Execution-Time-Ms') || Math.round(end - start))} ms`;

                const data = await res.json();
                bodyEl.textContent = JSON.stringify(data, null, 2);
            } catch (err) {
                statusEl.textContent = 'Erro de Conexão';
                statusEl.className = 'text-red-400 font-bold';
                bodyEl.textContent = String(err);
            }
        }
    </script>
</body>
</html>
