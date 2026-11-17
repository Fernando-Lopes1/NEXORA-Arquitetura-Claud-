# NEXORA — Field Service ERP (Arquitetura Distribuída em Cloud)

> **Projeto Arquitetura Completa — Cloud (Microsoft Azure)**  
> **Integrantes:** Éden Samuel · Fernando Lopes · Felipe Carneiro · Henrique Ricardo · Hugo Takeda  
> *(Referência oficial: [GRUPO.md](GRUPO.md))*

---

## 🎥 Vídeo de Demonstração (YouTube — Não Listado)

- **Link do Vídeo:** *Aguardando publicação (demonstração na nuvem com todos os integrantes de câmera aberta)*

---

## 🌐 Links Públicos em Produção (Microsoft Azure — `rg-nexora-ca`)

| Camada / Componente | Serviço no Azure | URL Pública |
| :--- | :--- | :--- |
| 🟢 **Microfrontend Principal (SPA)** | `nexora-host-fernando` | https://nexora-host-fernando.azurewebsites.net |
| 🔵 **Microfrontend Dashboard BI** | `nexora-host-dashboard-fernando` | https://nexora-host-dashboard-fernando.azurewebsites.net |
| ⚡ **API Gateway & BFF (Laravel/PHP)** | `nexora-gateway-fernando` | https://nexora-gateway-fernando.azurewebsites.net/api/bff/status |
| 📄 **Swagger do API Gateway** | `nexora-gateway-fernando` | https://nexora-gateway-fernando.azurewebsites.net/api/documentation |
| 📦 **Microsserviço 1 — Ordens de Serviço (`os-service`)** | `nexora-remote-fernando` | https://nexora-remote-fernando.azurewebsites.net/health |
| 📄 **Swagger `os-service`** | `nexora-remote-fernando` | https://nexora-remote-fernando.azurewebsites.net/api-docs |
| 📦 **Microsserviço 2 — Técnicos (`tecnicos-service`)** | `nexora-remote-dashboard-fernando` | https://nexora-remote-dashboard-fernando.azurewebsites.net/health |
| 📄 **Swagger `tecnicos-service`** | `nexora-remote-dashboard-fernando` | https://nexora-remote-dashboard-fernando.azurewebsites.net/api-docs |

---

## 🏛️ Arquitetura da Solução

- **Estilo Arquitetural:** **Clean / Hexagonal Architecture** (Ports & Adapters), com separação explícita em camadas (**Domínio**, **Aplicação**, **Infraestrutura** e **Apresentação/API**) e aplicação dos princípios **SOLID**.
- **Padrões Aplicados:** Microservices, Microfrontends (Webpack Module Federation), API Gateway, BFF (Backend for Frontend), Database-per-Service, CORS centralizado e Mensageria Assíncrona (Event-Driven).
- **Documentação Completa (Arc42):** [docs/ARC42.md](docs/ARC42.md)

### Fluxo da Aplicação
1. O usuário acessa o **Microfrontend** (`nexora-host-fernando`).
2. O Frontend consome **exclusivamente** o **API Gateway & BFF** (`nexora-gateway-fernando`), sem acessar os microsserviços diretamente.
3. O **BFF** consulta e agrega dados do **Microsserviço 1 (`os-service` — Azure SQL Database)** e do **Microsserviço 2 (`tecnicos-service` — MongoDB Atlas)**, devolvendo uma resposta única ao Frontend.
4. Os microsserviços trocam eventos assíncronos via **Azure Service Bus** (`nexora-bus-fernando.servicebus.windows.net` / fila `nexora-ordens-eventos`).

---

## 🧱 Componentes & Persistência (Database-per-Service)

- **Microfrontend (React + Module Federation):** `host/`, `remote/`, `host-dashboard/`, `remote-dashboard/`
- **API Gateway & BFF (PHP 8.2 / Laravel 11):** `app/Gateway/` e `gateway-laravel/` (proxy CRUD, agregação BFF, `X-Correlation-Id`, CORS, Swagger)
- **Microsserviço `os-service` (Node.js / TypeScript / Express):** `os-service/` — **Azure SQL Database** (`nexora-database.database.windows.net`) + **Publisher Azure Service Bus** + Swagger
- **Microsserviço `tecnicos-service` (Node.js / TypeScript / Express):** `tecnicos-service/` — **MongoDB Atlas** (`nexora_tecnicos`) + **Consumer Azure Service Bus** + Swagger

---

## 🧪 Testes (Unitários e de Arquitetura)

Todos os projetos possuem testes unitários e testes de arquitetura:
- **Suíte completa:** `npm run test:complete`
- **Testes de Arquitetura:** `TDE4-Testes-Arquitetura/` (Pest Arch para Gateway/PHP e `dependency-cruiser` para Backend/Frontend)
- **Testes Unitários/CRUD:** `os-service/tests/`, `tecnicos-service/tests/`, `tests/` e `scripts/test-frontend-architecture-and-unit.mjs`

---

## 📂 Repositórios no GitHub

- **Repositório Principal Consolidado:** https://github.com/Fernando-Lopes1/NEXORA-Arquitetura-Claud-.git
- **Documentação por Projeto (para os 3 repositórios separados — Frontend, Gateway e Backend):**
  - `docs/repositorios/frontend/` (`README.md` e `ARC42.md`)
  - `docs/repositorios/gateway/` (`README.md` e `ARC42.md`)
  - `docs/repositorios/backend/` (`README.md` e `ARC42.md`)
  - Script de exportação: `scripts/export-3-repos.sh`

---

## 🚀 Como Rodar Localmente

### 1. Microsserviços e Microfrontends
```bash
npm install
.\start-all.ps1
```

### 2. API Gateway & BFF (Laravel)
```bash
cd gateway-laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan serve --port=8080
```

### 3. Executar Testes
```bash
npm run test:complete
```
