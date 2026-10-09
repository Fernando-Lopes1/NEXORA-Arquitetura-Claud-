# NEXORA — Field Service ERP (Microsserviços & Micro-Frontends)

**Atividade Formativa — Arquitetura de Microsserviços e Micro-Frontends em Nuvem**  
*Disciplina de Arquitetura de Soluções / Arquitetura de Software*

Este repositório contém a implementação completa do ecossistema distribuído do **NEXORA**, um ERP modular para Gestão de Serviços de Campo (*Field Service Management*). O projeto implementa a arquitetura de **Microsserviços com padrão Database-per-Service** no backend e **Micro-Frontends com Webpack Module Federation** no frontend, totalmente integrados e implantados no **Microsoft Azure**.

---

## 👥 Integrantes do Grupo

- **Éden Samuel**
- **Fernando Lopes**
- **Felipe Carneiro**
- **Henrique Ricardo**
- **Hugo Takeda**

*Arquivo de referência:* [GRUPO.md](file:///d:/Faculdade/Big%20data/GRUPO.md)

---

## 🌐 Links Públicos Oficiais de Produção no Azure (4 Links Ativos)

O ecossistema é servido por **4 aplicações independentes na nuvem do Azure**:

| Tipo | Aplicação | Link de Produção | Descrição / Interface |
|---|---|---|---|
| 🟢 **Frontend MFE 1** | Host Gestão de OS | [https://nexora-host-fernando.azurewebsites.net](https://nexora-host-fernando.azurewebsites.net) | Shell Integrado + Remote MFE de Abertura e Gestão de Ordens de Serviço |
| 🔵 **Frontend MFE 2** | Host Dashboard BI | [https://nexora-host-dashboard-fernando.azurewebsites.net](https://nexora-host-dashboard-fernando.azurewebsites.net) | Shell Executivo de BI + Remote MFE com KPIs analíticos operacionais |
| ⚡ **Microsserviço 1** | `os-service` | [https://nexora-remote-fernando.azurewebsites.net](https://nexora-remote-fernando.azurewebsites.net) | CRUD de Ordens de Serviço, ciclo de vida, Swagger UI interativo e Health Check |
| ⚡ **Microsserviço 2** | `tecnicos-service` | [https://nexora-remote-dashboard-fernando.azurewebsites.net](https://nexora-remote-dashboard-fernando.azurewebsites.net) | CRUD de Técnicos de Campo, disponibilidade, Swagger UI interativo e Health Check |

---

## 🏗️ Visão Geral da Arquitetura Distribuída

A solução implementa a decomposição canônica em **Bounded Contexts (DDD)** e isolamento físico de persistência via **Database-per-Service**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CAMADA DE APRESENTAÇÃO                                 │
│                                                                                        │
│     Shell Host OS (Porta :3000)                   Shell Host Dashboard (Porta :3004)   │
│   ┌─────────────────────────────┐               ┌──────────────────────────────────┐   │
│   │   OrderForm MFE (:3001)     │               │     Dashboard MFE (:3002)        │   │
│   └──────────────┬──────────────┘               └─────────────────┬────────────────┘   │
└──────────────────┼────────────────────────────────────────────────┼────────────────────┘
                   │                                                │
   HTTP /api/ordens│                                                │ HTTP /api/tecnicos
     (Porta :8081) │                                                │ (Porta :8082)
                   ▼                                                ▼
┌───────────────────────────────────────┐      ┌────────────────────────────────────────┐
│              os-service               │      │            tecnicos-service            │
│         localhost:8081 (Azure)        │      │         localhost:8082 (Azure)         │
│                                       │      │                                        │
│  • CRUD completo de Ordens de Serviço │      │  • CRUD completo de Técnicos de Campo  │
│  • Validação de ciclo de vida (status)│      │  • Gestão de especialidades e regiões  │
│  • Regras de prioridade e valores     │      │  • Controle de disponibilidade         │
│  • Documentação OpenAPI / Swagger UI  │      │  • Documentação OpenAPI / Swagger UI   │
│  • Health check (/health)             │      │  • Health check (/health)              │
│                                       │      │                                        │
│   ┌───────────────────────────────┐   │      │   ┌────────────────────────────────┐   │
│   │   Banco SQLite / PostgreSQL   │   │      │   │   Banco SQLite / PostgreSQL    │   │
│   │        data/os.sqlite         │   │      │   │      data/tecnicos.sqlite      │   │
│   └───────────────────────────────┘   │      │   └────────────────────────────────┘   │
│        (Database per Service)         │      │         (Database per Service)         │
└───────────────────────────────────────┘      └────────────────────────────────────────┘
```

---

## 📐 Padrões Arquiteturais Implementados

| Padrão | Onde é Aplicado | Benefício Técnico & Conceito Didático |
|---|---|---|
| **Database per Service** | `os-service` e `tecnicos-service` | Cada microsserviço gerencia seu próprio banco de dados relacional. Não há tabelas compartilhadas nem Foreign Keys diretas entre serviços, garantindo autonomia absoluta e desacoplamento. |
| **Domain-Driven Design (Bounded Contexts)** | Separação OS vs Técnicos | O domínio de ciclo de vida de atendimentos/OS é estritamente delimitado e independente da gestão de recursos humanos e disponibilidade técnica. |
| **Comunicação REST Padronizada** | Clientes & MFE ➔ APIs | Contratos RESTful com verbos semânticos (GET, POST, PUT, DELETE, PATCH), paginação, filtros e códigos HTTP canônicos (200, 201, 400, 404). |
| **Documentação OpenAPI & Swagger** | `/api-docs` em cada serviço | Documentação viva, interativa e executável diretamente no navegador web. |
| **Observabilidade e Health Checks** | `/health` em cada serviço | Endpoint de monitoramento contínuo para diagnóstico de status (`UP`) e conectividade com a camada de dados. |
| **Tolerância a Falhas & Resiliência** | Isolamento de Microsserviços | A queda completa do `os-service` não compromete a execução, leitura ou escrita no `tecnicos-service`, e vice-versa. |

---

## 🗺️ Mapa de Portas e Endpoints REST

### 1. `os-service` — Porta `8081` (Local) / Azure `nexora-remote-fernando`
- **Swagger UI:** [http://localhost:8081/api-docs](http://localhost:8081/api-docs) ou [https://nexora-remote-fernando.azurewebsites.net/api-docs](https://nexora-remote-fernando.azurewebsites.net/api-docs)
- **OpenAPI Spec JSON:** `GET /api-docs.json`
- **Health Check:** `GET /health` (Retorna status `UP` e status do banco de dados)
- **Rotas CRUD:**
  - `GET /api/ordens`: Lista ordens (suporta filtros `?status=Aberta`, `?prioridade=Alta`, `?cliente=Hospital`)
  - `GET /api/ordens/:id`: Detalha uma OS por ID numérico
  - `POST /api/ordens`: Cadastra nova OS com validação de campos obrigatórios e formato
  - `PUT /api/ordens/:id`: Atualização completa de dados cadastrais
  - `PATCH /api/ordens/:id/status`: Transição de status da OS (`Aberta` ➔ `Agendada` ➔ `Em Execução` ➔ `Concluída` / `Cancelada`) com guarda de técnico obrigatório
  - `DELETE /api/ordens/:id`: Remove ou cancela uma OS existente

### 2. `tecnicos-service` — Porta `8082` (Local) / Azure `nexora-remote-dashboard-fernando`
- **Swagger UI:** [http://localhost:8082/api-docs](http://localhost:8082/api-docs) ou [https://nexora-remote-dashboard-fernando.azurewebsites.net/api-docs](https://nexora-remote-dashboard-fernando.azurewebsites.net/api-docs)
- **OpenAPI Spec JSON:** `GET /api-docs.json`
- **Health Check:** `GET /health` (Retorna status `UP` e status do banco de dados)
- **Rotas CRUD:**
  - `GET /api/tecnicos`: Lista técnicos (suporta filtros `?especialidade=Climatização`, `?status=Disponível`, `?regiao=Centro`)
  - `GET /api/tecnicos/:id`: Detalha informações completas do técnico
  - `POST /api/tecnicos`: Cadastra novo técnico de campo com validações
  - `PUT /api/tecnicos/:id`: Atualiza dados de contato, região e especialidade
  - `PATCH /api/tecnicos/:id/disponibilidade`: Atualiza disponibilidade (`Disponível`, `Em Atendimento`, `Ausente`)
  - `DELETE /api/tecnicos/:id`: Exclui técnico da base

---

## 🚀 Como Executar Localmente

### Opção 1: Inicialização Automática Conjunta (Recomendado)

Inicia ambos os microsserviços simultaneamente em terminais separados:

**No Windows PowerShell:**
```powershell
.\start-all.ps1
```

**No Prompt de Comando (CMD) ou clique duplo:**
```cmd
.\start-all.bat
```

Dois terminais serão abertos exibindo o log de inicialização e o link do Swagger UI em:
- `http://localhost:8081/api-docs` (os-service)
- `http://localhost:8082/api-docs` (tecnicos-service)

---

### Opção 2: Inicialização via NPM

```bash
# Na raiz do projeto:
npm run services:dev
```

---

## 🧪 Como Rodar os Testes Automatizados

A solução conta com **duas camadas de testes automatizados**:

### 1. Testes de Unidade e Domínio dos Microsserviços (68 testes)
```bash
npm run services:test
```
- **`os-service`**: 33 testes cobrindo CRUD, ciclo de vida, validações e erros 400/404.
- **`tecnicos-service`**: 35 testes cobrindo CRUD, disponibilidade, validações e erros 400/404.

### 2. Suíte Integrada End-to-End (46 testes)
```bash
npm run test:crud
```
O executor automatizado (`scripts/test-crud.js`):
1. Detecta ou sobe automaticamente os microsserviços nas portas 8081 e 8082.
2. Executa todas as operações CRUD reais com requisições HTTP via Fetch.
3. Valida os códigos `200 OK`, `201 Created`, `400 Bad Request` e `404 Not Found`.
4. Encerra os processos de teste de forma limpa.

---

## ☁️ Esteiras de CI/CD no GitHub Actions

O repositório possui **4 fluxos automatizados de deploy contínuo** para o Azure App Service:

1. `.github/workflows/main_nexora-host-fernando.yml`: Compila e implanta o Shell de Ordens de Serviço (`nexora-host-fernando`).
2. `.github/workflows/main_nexora-host-dashboard-fernando.yml`: Compila e implanta o Shell de Dashboard BI (`nexora-host-dashboard-fernando`).
3. `.github/workflows/main_nexora-remote-fernando.yml`: Compila TypeScript e implanta o `os-service` no Azure Web App (`nexora-remote-fernando`).
4. `.github/workflows/main_nexora-remote-dashboard-fernando.yml`: Compila TypeScript e implanta o `tecnicos-service` no Azure Web App (`nexora-remote-dashboard-fernando`).

---

## 📁 Estrutura de Diretórios do Projeto

```text
NEXORA(Arquitetura Claud)/
├── os-service/                  # Microsserviço 1 - CRUD Ordens de Serviço (Porta 8081)
│   ├── src/
│   │   ├── config/              # Variáveis de ambiente e portas
│   │   ├── controllers/         # Controladores HTTP REST
│   │   ├── database/            # Adaptador Database-per-Service (SQLite + Postgres)
│   │   ├── models/              # Entidades e validações de ciclo de vida
│   │   ├── routes/              # Definição de rotas da API
│   │   └── swagger/             # Especificação OpenAPI 3.0
│   ├── tests/                   # 33 testes automatizados
│   └── package.json
├── tecnicos-service/            # Microsserviço 2 - CRUD Técnicos de Campo (Porta 8082)
│   ├── src/
│   │   ├── config/              # Configurações do serviço
│   │   ├── controllers/         # Controladores REST
│   │   ├── database/            # Adaptador Database-per-Service isolado
│   │   ├── models/              # Entidades e regras de disponibilidade
│   │   ├── routes/              # Rotas da API
│   │   └── swagger/             # Especificação OpenAPI 3.0
│   ├── tests/                   # 35 testes automatizados
│   └── package.json
├── host/                        # Shell Frontend - Funcionalidade 1 (Porta 3000)
├── remote/                      # Micro-Frontend - Funcionalidade 1 (Porta 3001)
├── host-dashboard/              # Shell Frontend - Funcionalidade 2 (Porta 3004)
├── remote-dashboard/            # Micro-Frontend - Funcionalidade 2 (Porta 3002)
├── scripts/
│   └── test-crud.js             # Executor E2E de testes automatizados com relatório
├── .github/
│   └── workflows/               # 4 esteiras de deploy automatizado no Azure
├── start-all.ps1                # Script PowerShell para iniciar os microsserviços
├── start-all.bat                # Script Batch para iniciar os microsserviços
├── GRUPO.md                     # Identificação dos alunos do grupo
├── README.md                    # Documentação oficial do projeto
└── package.json                 # Orquestrador de scripts npm
```
