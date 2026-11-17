# NEXORA — Field Service ERP (Repositório Consolidado)

> **Disciplina:** Arquitetura de Soluções / Arquitetura de Software  
> **Objetivo:** Aplicação distribuída na Nuvem do Microsoft Azure aplicando Microsserviços, BFF, API Gateway, Microfrontends, Database-per-Service, CORS, SOLID e Arquitetura em Camadas.

---

## 👥 Integrantes do Grupo

- **Éden Samuel**
- **Fernando Lopes**
- **Felipe Carneiro**
- **Henrique Ricardo**
- **Hugo Takeda**

*Referência:* [GRUPO.md](file:///d:/Faculdade/Big%20data/GRUPO.md)

---

## 🔗 Links Oficiais (GitHub & Produção Azure)

### Repositórios no GitHub
- **Repositório Principal Consolidado (Front + Back + Gateway):** https://github.com/Fernando-Lopes1/NEXORA-Arquitetura-Claud-.git
- **Repositório Original do API Gateway & BFF (Laravel):** https://github.com/Fernando-Lopes1/NEXORA-GATEWAY-LARAVEL.git

### Aplicações em Produção no Microsoft Azure
| Componente | Aplicação | URL Pública |
| :--- | :--- | :--- |
| ⚡ **API Gateway & BFF** | `nexora-gateway-fernando` | https://nexora-gateway-fernando.azurewebsites.net |
| 🟢 **Microfrontend 1 (OS)** | `nexora-host-fernando` | https://nexora-host-fernando.azurewebsites.net |
| 🔵 **Microfrontend 2 (BI)** | `nexora-host-dashboard-fernando` | https://nexora-host-dashboard-fernando.azurewebsites.net |
| 📦 **Microsserviço 1 (`os-service`)** | `nexora-remote-fernando` | https://nexora-remote-fernando.azurewebsites.net |
| 📦 **Microsserviço 2 (`tecnicos-service`)** | `nexora-remote-dashboard-fernando` | https://nexora-remote-dashboard-fernando.azurewebsites.net |

---

## 📊 Situação Atual da Solução (O que tem vs. O que não tem)

| Requisito do Trabalho | Status | Situação / Observação |
| :--- | :---: | :--- |
| **Microfrontend (SPA)** | ✅ | Implementado em React + Webpack Module Federation (`host`, `remote`, `host-dashboard`, `remote-dashboard`). |
| **API Gateway & BFF** | ✅ | Implementado em PHP 8.2 / Laravel 11 (`gateway-laravel/`), com proxy reverso, agregação BFF, `X-Correlation-Id` e CORS. |
| **Swagger no Gateway/BFF** | ⚠️ | Swagger UI presente nos microsserviços (`os-service` e `tecnicos-service`); pendente configurar OpenAPI/Swagger no Gateway Laravel (`l5-swagger`). |
| **Microserviço 1 (MongoDB / CosmosDB)** | ⚠️ | `os-service` possui CRUD completo e Swagger; neste repositório local está com SQLite/PostgreSQL (versão com MongoDB em outro ambiente). |
| **Microserviço 2 (Azure SQL Database)** | ⚠️ | `tecnicos-service` possui CRUD completo e Swagger; neste repositório local está com SQLite/PostgreSQL (versão com Azure SQL em outro ambiente). |
| **Broker (Azure Service Bus)** | ⚠️ | Configurado/tratado em outro ambiente; pendente unificar o código do consumidor/publicador neste repositório consolidado. |
| **Testes Unitários** | ✅ | Presentes em `os-service/tests/`, `tecnicos-service/tests/` e `gateway-laravel/tests/`. |
| **Testes de Arquitetura** | ✅ | Presentes na branch `origin/main` (`TDE4-Testes-Arquitetura` com Pest Arch + `dependency-cruiser`). |
| **Documentação Arc42** | ⚠️ | Documentação Arc42 completa gerada em outro notebook; falta trazer o arquivo `.md` para este repositório. |
| **Vídeo no YouTube (Não listado)** | ⏳ | Roteiro pronto (`roteiro_video_nexora.pdf`); pendente gravar com todos os integrantes de câmera aberta demonstrando na nuvem e colar o link aqui. |

---

## 📁 Estrutura Consolidada neste Repositório

- `host/` e `remote/` — Microfrontend de Gestão de Ordens de Serviço (React + Module Federation)
- `host-dashboard/` e `remote-dashboard/` — Microfrontend de Dashboard BI (React + Module Federation)
- `gateway-laravel/` — API Gateway & BFF (PHP 8.2 / Laravel 11)
- `os-service/` — Microsserviço de Ordens de Serviço (Node.js / TypeScript / Express / Swagger)
- `tecnicos-service/` — Microsserviço de Técnicos de Campo (Node.js / TypeScript / Express / Swagger)

---

## 🚀 Como Rodar Localmente

### 1. Microsserviços e Microfrontends
```bash
# Na raiz do projeto
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

---

## 🎥 Vídeo de Entrega (YouTube)

- **Link do vídeo (Não listado):** *Aguardando publicação*
