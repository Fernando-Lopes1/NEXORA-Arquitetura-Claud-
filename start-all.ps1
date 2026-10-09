<#
.SYNOPSIS
    Inicializa todos os microsserviços autônomos do NEXORA Field Service ERP.

.DESCRIPTION
    Inicia os-service (Porta 8081) e tecnicos-service (Porta 8082) em janelas de terminal
    independentes, permitindo visualização individual de logs e ciclo de vida autônomo,
    em conformidade com o padrão Database-per-Service.
#>

[CmdletBinding()]
param()

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$RootDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$OsDir = Join-Path $RootDir "os-service"
$TecnicosDir = Join-Path $RootDir "tecnicos-service"

Clear-Host

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "       🚀 NEXORA FIELD SERVICE ERP - INICIALIZADOR DE MICROSSERVIÇOS       " -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host ""

# Validação prévia de diretórios
if (-not (Test-Path $OsDir)) {
    Write-Error "Diretório do 'os-service' não encontrado em: $OsDir"
    exit 1
}

if (-not (Test-Path $TecnicosDir)) {
    Write-Error "Diretório do 'tecnicos-service' não encontrado em: $TecnicosDir"
    exit 1
}

Write-Host "📦 Disparando processos independentes em novas janelas..." -ForegroundColor Yellow
Write-Host ""

# 1. os-service (Porta 8081)
$OsCommand = "Set-Location -LiteralPath '$OsDir'; `$Host.UI.RawUI.WindowTitle = 'NEXORA: os-service (8081)'; Write-Host '====================================================' -ForegroundColor Cyan; Write-Host '🚀 [os-service] NEXORA Ordem de Serviço (Porta 8081)' -ForegroundColor Cyan; Write-Host '====================================================' -ForegroundColor Cyan; npm run dev"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $OsCommand
Write-Host "  ✅ [1/2] os-service iniciado na Porta 8081 (Janela Dedicada)" -ForegroundColor Green

# 2. tecnicos-service (Porta 8082)
$TecnicosCommand = "Set-Location -LiteralPath '$TecnicosDir'; `$Host.UI.RawUI.WindowTitle = 'NEXORA: tecnicos-service (8082)'; Write-Host '====================================================' -ForegroundColor Yellow; Write-Host '🚀 [tecnicos-service] NEXORA Técnicos (Porta 8082)' -ForegroundColor Yellow; Write-Host '====================================================' -ForegroundColor Yellow; npm run dev"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $TecnicosCommand
Write-Host "  ✅ [2/2] tecnicos-service iniciado na Porta 8082 (Janela Dedicada)" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "                      📋 MAPA DE ENDPOINTS DISPONÍVEIS                    " -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📦 1. os-service (Microsserviço de Ordens de Serviço)" -ForegroundColor Cyan
Write-Host "   • Porta Local:         8081"
Write-Host "   • REST API:            http://localhost:8081/api/ordens"
Write-Host "   • Health Check:        http://localhost:8081/health"
Write-Host "   • Swagger UI:          http://localhost:8081/api-docs"
Write-Host "   • OpenAPI Spec (JSON): http://localhost:8081/api-docs.json"
Write-Host "   • Produção Azure:      https://nexora-remote-fernando.azurewebsites.net"

Write-Host ""
Write-Host "📦 2. tecnicos-service (Microsserviço de Técnicos de Campo)" -ForegroundColor Yellow
Write-Host "   • Porta Local:         8082"
Write-Host "   • REST API:            http://localhost:8082/api/tecnicos"
Write-Host "   • Health Check:        http://localhost:8082/health"
Write-Host "   • Swagger UI:          http://localhost:8082/api-docs"
Write-Host "   • OpenAPI Spec (JSON): http://localhost:8082/api-docs.json"
Write-Host "   • Produção Azure:      https://nexora-remote-dashboard-fernando.azurewebsites.net"

Write-Host ""
Write-Host "--------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "🌐 NOTAS DE INTEGRAÇÃO COM OS FRONTENDS (MICRO-FRONTENDS / SHELL):" -ForegroundColor Magenta
Write-Host "  • CORS global ativo em ambos os microsserviços para conexões originadas de:"
Write-Host "      - Frontend 1 (Gestão OS):        http://localhost:3000 / https://nexora-host-fernando.azurewebsites.net"
Write-Host "      - Frontend 2 (Dashboard MFE):    http://localhost:3001 / https://nexora-host-dashboard-fernando.azurewebsites.net"
Write-Host "  • Padrão Arquitetural: Database-per-Service (bancos isolados SQLite/PostgreSQL)."
Write-Host "--------------------------------------------------------------------------" -ForegroundColor DarkGray

Write-Host ""
Write-Host "💡 COMANDOS ÚTEIS:" -ForegroundColor Green
Write-Host "  • Validar rotas CRUD:   npm run test:crud"
Write-Host "  • Rodar todos testes:   npm run test:all"
Write-Host "  • Para encerrar:        Feche as respectivas janelas de terminal do PowerShell."
Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "✨ Serviços em execução. Pressione qualquer tecla para sair deste inicializador..."
[void][System.Console]::ReadKey($true)
