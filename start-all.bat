@echo off
chcp 65001 > nul
title NEXORA Field Service ERP - Inicializador de Microsserviços

set ROOT_DIR=%~dp0
set OS_DIR=%ROOT_DIR%os-service
set TECNICOS_DIR=%ROOT_DIR%tecnicos-service

cls
echo ==========================================================================
echo        NEXORA FIELD SERVICE ERP - INICIALIZADOR DE MICROSSERVIÇOS
echo ==========================================================================
echo.

if not exist "%OS_DIR%" (
    echo [ERRO] Diretório do os-service não encontrado em: %OS_DIR%
    pause
    exit /b 1
)

if not exist "%TECNICOS_DIR%" (
    echo [ERRO] Diretório do tecnicos-service não encontrado em: %TECNICOS_DIR%
    pause
    exit /b 1
)

echo [*] Disparando processos independentes em novas janelas cmd.exe...
echo.

:: 1. Iniciar os-service (Porta 8081)
start "NEXORA: os-service (Porta 8081)" cmd /k "cd /d "%OS_DIR%" && title NEXORA: os-service (Porta 8081) && echo ==================================================== && echo   NEXORA os-service (Porta 8081) && echo ==================================================== && npm run dev"
echo   [OK] [1/2] os-service iniciado na Porta 8081 (Janela CMD Dedicada)

:: 2. Iniciar tecnicos-service (Porta 8082)
start "NEXORA: tecnicos-service (Porta 8082)" cmd /k "cd /d "%TECNICOS_DIR%" && title NEXORA: tecnicos-service (Porta 8082) && echo ==================================================== && echo   NEXORA tecnicos-service (Porta 8082) && echo ==================================================== && npm run dev"
echo   [OK] [2/2] tecnicos-service iniciado na Porta 8082 (Janela CMD Dedicada)

echo.
echo ==========================================================================
echo                       MAPA DE ENDPOINTS DISPONÍVEIS
echo ==========================================================================
echo.
echo [1] os-service (Microsserviço de Ordens de Serviço):
echo   - Porta Local:         8081
echo   - REST API:            http://localhost:8081/api/ordens
echo   - Health Check:        http://localhost:8081/health
echo   - Swagger UI:          http://localhost:8081/api-docs
echo   - OpenAPI Spec (JSON): http://localhost:8081/api-docs.json
echo   - Produção Azure:      https://nexora-remote-fernando.azurewebsites.net
echo.
echo [2] tecnicos-service (Microsserviço de Técnicos de Campo):
echo   - Porta Local:         8082
echo   - REST API:            http://localhost:8082/api/tecnicos
echo   - Health Check:        http://localhost:8082/health
echo   - Swagger UI:          http://localhost:8082/api-docs
echo   - OpenAPI Spec (JSON): http://localhost:8082/api-docs.json
echo   - Produção Azure:      https://nexora-remote-dashboard-fernando.azurewebsites.net
echo.
echo --------------------------------------------------------------------------
echo NOTAS DE INTEGRAÇÃO COM OS FRONTENDS (MICRO-FRONTENDS / SHELL):
echo   * CORS global habilitado para comunicação com os frontends MFE:
echo       - Frontend 1 (Gestão OS):     http://localhost:3000 / https://nexora-host-fernando.azurewebsites.net
echo       - Frontend 2 (Dashboard MFE): http://localhost:3001 / https://nexora-host-dashboard-fernando.azurewebsites.net
echo   * Padrão Arquitetural: Database-per-Service (bancos isolados SQLite/PostgreSQL).
echo --------------------------------------------------------------------------
echo.
echo DICAS:
echo   - Para validar todas as rotas CRUD: execute 'npm run test:crud'
echo   - Para rodar todos os testes:       execute 'npm run test:all'
echo   - Para encerrar os microsserviços:  feche as respectivas janelas do CMD.
echo.
echo ==========================================================================
echo Pressione qualquer tecla para fechar esta janela de inicialização...
pause > nul
