Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "              NEXORA - API GATEWAY & BFF (PHP / LARAVEL)" -ForegroundColor Green
Write-Host "                   Porta Padrao: http://localhost:8080" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot

if (-not (Test-Path "vendor")) {
    Write-Host "[1/2] Instalando dependencias com Composer..." -ForegroundColor Yellow
    composer install
}

if (-not (Test-Path ".env")) {
    Write-Host "[1/2] Copiando .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    php artisan key:generate
}

Write-Host "[2/2] Iniciando API Gateway e BFF na porta 8080..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Console Interativo:  http://localhost:8080" -ForegroundColor White
Write-Host "  Health Check:        http://localhost:8080/api/health" -ForegroundColor White
Write-Host "  BFF Dashboard:       http://localhost:8080/api/bff/dashboard" -ForegroundColor White
Write-Host "  BFF Status:          http://localhost:8080/api/bff/status" -ForegroundColor White
Write-Host ""

php artisan serve --port=8080
