#!/usr/bin/env bash
# ==============================================================================
# Script de Exportação dos 3 Repositórios Separados para Publicação no GitHub:
#   1. nexora-frontend (Microfrontend SPA: host, remote, host-dashboard, remote-dashboard)
#   2. nexora-gateway  (API Gateway & BFF: Laravel 11, Clean Arch, SOLID, Swagger)
#   3. nexora-backend  (Microserviços: tecnicos-service MongoDB Atlas + os-service Azure SQL + Service Bus)
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-${ROOT_DIR}/dist-repositorios}"

echo "📦 Exportando os 3 projetos separados para: ${OUT_DIR}"
mkdir -p "${OUT_DIR}/nexora-frontend" "${OUT_DIR}/nexora-gateway" "${OUT_DIR}/nexora-backend"

# 1. Repositório Frontend
cp -r "${ROOT_DIR}/host" "${ROOT_DIR}/remote" "${ROOT_DIR}/host-dashboard" "${ROOT_DIR}/remote-dashboard" "${OUT_DIR}/nexora-frontend/"
mkdir -p "${OUT_DIR}/nexora-frontend/scripts" "${OUT_DIR}/nexora-frontend/TDE4-Testes-Arquitetura/frontend"
cp "${ROOT_DIR}/scripts/test-frontend-architecture-and-unit.mjs" "${OUT_DIR}/nexora-frontend/scripts/"
cp "${ROOT_DIR}/TDE4-Testes-Arquitetura/frontend/.dependency-cruiser.cjs" "${OUT_DIR}/nexora-frontend/TDE4-Testes-Arquitetura/frontend/"
cp "${ROOT_DIR}/docs/repositorios/frontend/README.md" "${OUT_DIR}/nexora-frontend/README.md"
cp "${ROOT_DIR}/docs/repositorios/frontend/ARC42.md" "${OUT_DIR}/nexora-frontend/ARC42.md"

# 2. Repositório Gateway & BFF
cp -r "${ROOT_DIR}/app" "${ROOT_DIR}/bootstrap" "${ROOT_DIR}/config" "${ROOT_DIR}/database" "${ROOT_DIR}/public" "${ROOT_DIR}/resources" "${ROOT_DIR}/routes" "${ROOT_DIR}/tests" "${OUT_DIR}/nexora-gateway/"
cp "${ROOT_DIR}/artisan" "${ROOT_DIR}/composer.json" "${ROOT_DIR}/phpunit.xml" "${OUT_DIR}/nexora-gateway/"
mkdir -p "${OUT_DIR}/nexora-gateway/TDE4-Testes-Arquitetura/gateway"
cp "${ROOT_DIR}/TDE4-Testes-Arquitetura/gateway/GatewayArchTest.php" "${OUT_DIR}/nexora-gateway/TDE4-Testes-Arquitetura/gateway/"
cp "${ROOT_DIR}/docs/repositorios/gateway/README.md" "${OUT_DIR}/nexora-gateway/README.md"
cp "${ROOT_DIR}/docs/repositorios/gateway/ARC42.md" "${OUT_DIR}/nexora-gateway/ARC42.md"

# 3. Repositório Backend (Microserviços MongoDB Atlas + Azure SQL + Azure Service Bus)
cp -r "${ROOT_DIR}/os-service" "${ROOT_DIR}/tecnicos-service" "${OUT_DIR}/nexora-backend/"
mkdir -p "${OUT_DIR}/nexora-backend/TDE4-Testes-Arquitetura/backend"
cp "${ROOT_DIR}/TDE4-Testes-Arquitetura/backend/.dependency-cruiser.cjs" "${OUT_DIR}/nexora-backend/TDE4-Testes-Arquitetura/backend/"
cp "${ROOT_DIR}/docs/repositorios/backend/README.md" "${OUT_DIR}/nexora-backend/README.md"
cp "${ROOT_DIR}/docs/repositorios/backend/ARC42.md" "${OUT_DIR}/nexora-backend/ARC42.md"

echo "✅ Exportação concluída com sucesso em ${OUT_DIR}:"
echo "   - ${OUT_DIR}/nexora-frontend (README.md + ARC42.md + 4 MFEs + Testes Unitários e Arquitetura)"
echo "   - ${OUT_DIR}/nexora-gateway  (README.md + ARC42.md + API Gateway & BFF + Testes Unitários e Arquitetura)"
echo "   - ${OUT_DIR}/nexora-backend  (README.md + ARC42.md + tecnicos-service Mongo + os-service SQL + Service Bus + Testes)"
