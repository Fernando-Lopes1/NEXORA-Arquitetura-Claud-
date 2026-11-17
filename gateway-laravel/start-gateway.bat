@echo off
title NEXORA - API Gateway & BFF (Laravel 11)
color 0A
echo =========================================================================
echo               NEXORA - API GATEWAY ^& BFF (PHP / LARAVEL)
echo                    Porta Padrao: http://localhost:8080
echo =========================================================================
echo.

cd /d "%~dp0"

echo [1/2] Verificando dependencias...
if not exist "vendor" (
    echo Instalando dependencias com Composer...
    call composer install
)

if not exist ".env" (
    echo Copiando .env.example para .env...
    copy .env.example .env
    php artisan key:generate
)

echo [2/2] Iniciando API Gateway e BFF na porta 8080...
echo.
echo  Console Interativo:  http://localhost:8080
echo  Health Check:        http://localhost:8080/api/health
echo  BFF Dashboard:       http://localhost:8080/api/bff/dashboard
echo  BFF Status:          http://localhost:8080/api/bff/status
echo.
php artisan serve --port=8080
pause
