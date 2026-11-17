# NEXORA — Projeto 1: Microfrontend SPA (React 18 & Webpack 5 Module Federation)

Repositório oficial do **Microfrontend (SPA)** do ecossistema **NEXORA — Field Service Management**, desenvolvido para a disciplina de **Arquitetura de Soluções em Nuvem** na **Microsoft Azure**.

---

## 👥 Nome dos Alunos (Integrantes do Grupo)

- **Éden Samuel**
- **Fernando Lopes**
- **Felipe Carneiro**
- **Henrique Ricardo**
- **Hugo Takeda**

---

## 🎥 Vídeo de Demonstração na Nuvem (YouTube — Não Listado)

> 🔗 **Link do Vídeo (YouTube Não Listado):** `[INSERIR LINK DO YOUTUBE NÃO LISTADO AQUI]`
>
> *Demonstração em nuvem (Microsoft Azure) com câmera aberta por todos os integrantes mostrando o Microfrontend consumindo o API Gateway & BFF e refletindo o CRUD completo nos bancos MongoDB Atlas e Azure SQL Database.*

---

## 🏛️ Arquitetura Utilizada e Separação em Camadas

Este projeto adota **Arquitetura de Microfrontends com Webpack 5 Module Federation** combinada com **Clean Frontend Architecture (Separation of Concerns & BFF-First Integration)**:

1. **Camada de Shell / Orquestração (`host/` e `host-dashboard/`)**:
   - Responsável pelo roteamento visual, layout corporativo, `ErrorBoundary` de resiliência e comunicação **exclusiva com o API Gateway & BFF** (`http://localhost:8080` localmente / `https://nexora-gateway-api.azurewebsites.net` na Azure).
   - **Regra Arquitetural Estrita**: O Microfrontend **nunca acessa os microsserviços (`:8081` ou `:8082`) diretamente**. Toda leitura consolidada passa por `GET /api/bff/visao-geral` (único response) e as mutações CRUD passam pelo proxy do Gateway (`/api/ordens` e `/api/tecnicos`).
2. **Camada de Módulos Federados Remotos (`remote/` e `remote-dashboard/`)**:
   - `remote` (`:3001`): Expõe `./OrderForm` e `./RemoteApp` via `remoteEntry.js`.
   - `remote-dashboard` (`:3002`): Expõe `./Dashboard` e `./RemoteDashboardApp` via `remoteEntry.js`.
3. **Camada de Fronteira Assíncrona (`src/index.js` -> `src/bootstrap.jsx`)**:
   - Resolve dependências compartilhadas (`react` e `react-dom` como `singleton: true`) antes da montagem da árvore de componentes.

📄 **Documentação Arc42 Completa (Seções 1 a 12):** [`ARC42.md`](./ARC42.md)

---

## 🌐 URLs de Produção na Nuvem (Microsoft Azure)

- **Host 1 — Gestão de Ordens de Serviço:** [https://nexora-host-fernando.azurewebsites.net](https://nexora-host-fernando.azurewebsites.net)
- **Remote 1 — OrderForm MFE:** [https://nexora-remote-fernando.azurewebsites.net](https://nexora-remote-fernando.azurewebsites.net)
- **Host 2 — Dashboard Executivo & Técnicos:** [https://nexora-host-dashboard-fernando.azurewebsites.net](https://nexora-host-dashboard-fernando.azurewebsites.net)
- **Remote 2 — Dashboard KPIs MFE:** [https://nexora-remote-dashboard-fernando.azurewebsites.net](https://nexora-remote-dashboard-fernando.azurewebsites.net)

---

## 🚀 Como Rodar Localmente

```bash
# 1. Instalar dependências dos Microfrontends
npm install
npm --prefix remote install
npm --prefix host install
npm --prefix remote-dashboard install
npm --prefix host-dashboard install

# 2. Iniciar o par principal de Microfrontends (Remote :3001 + Host :3000)
npm run dev

# 3. (Opcional) Iniciar o segundo par de Microfrontends (Remote Dashboard :3002 + Host Dashboard :3004)
npm --prefix remote-dashboard run dev
npm --prefix host-dashboard run dev
```

---

## 🧪 Testes Unitários e Testes de Arquitetura

```bash
# Executar Testes Unitários + Testes de Arquitetura (dependency-cruiser & BFF isolation)
npm run test:frontend
```

O comando executa:
1. **`dependency-cruiser` (`TDE4-Testes-Arquitetura/frontend/.dependency-cruiser.cjs`)**: Valida ausência de dependências circulares, isolamento entre Host e Remote, isolamento entre pares MFE e fronteira `index.js -> bootstrap.jsx`.
2. **Suíte Unitária e Arquitetural (`scripts/test-frontend-architecture-and-unit.mjs`)**: Valida que nenhum arquivo acessa `:8081`/`:8082` diretamente, testa a normalização do response único do BFF (`/api/bff/visao-geral`) e verifica os contratos dos componentes React.
