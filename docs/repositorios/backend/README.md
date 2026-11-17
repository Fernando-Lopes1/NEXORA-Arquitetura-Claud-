# NEXORA — Projeto 3: Backend Microservices (`tecnicos-service` MongoDB Atlas + `os-service` Azure SQL + Azure Service Bus)

Repositório oficial dos **Microsserviços de Backend** do ecossistema **NEXORA — Field Service Management**, desenvolvido para a disciplina de **Arquitetura de Soluções em Nuvem** na **Microsoft Azure**.

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
> *Demonstração em nuvem (Microsoft Azure) com câmera aberta por todos os integrantes mostrando o CRUD completo nos dois microsserviços, o reflexo nos bancos MongoDB Atlas e Azure SQL Database e a troca de mensagens pelo Azure Service Bus.*

---

## 🏛️ Arquitetura Utilizada e Separação em Camadas

Ambos os microsserviços adotam **Arquitetura Hexagonal (Ports & Adapters)** com **Database-per-Service** e princípios **SOLID**, auditados automaticamente por **dependency-cruiser** (`TDE4-Testes-Arquitetura/backend/.dependency-cruiser.cjs`):

1. **Driving Adapters (Primary Ports — Camada de Entrada HTTP)**:
   - `src/routes/`: Definição de rotas RESTful (`tecnico.routes.ts`, `ordem.routes.ts`).
   - `src/controllers/`: Validação de entrada, orquestração e respostas HTTP (`tecnico.controller.ts`, `ordem.controller.ts`).
2. **Application & Domain Core (Regras de Negócio e Mensageria)**:
   - `src/models/`: Entidades e contratos de domínio (`Tecnico.ts`, `OrdemServico.ts`).
   - `src/services/lifecycle.validator.ts`: Máquina de estados estrita do ciclo de vida da Ordem de Serviço (`Aberta` -> `Agendada` -> `Em Execução` -> `Concluída` / `Cancelada`).
   - `src/services/serviceBus.publisher.ts` (`os-service`) & `src/services/serviceBus.consumer.ts` (`tecnicos-service`): Integração assíncrona via **Azure Service Bus** (`nexora-ordens-eventos`).
3. **Driven Adapters (Secondary Ports — Persistência Poliglota Isolada)**:
   - `src/db/adapter.interface.ts`: Porta de saída `IDatabaseAdapter` (**Dependency Inversion Principle — DIP**).
   - **Microserviço 1 (`tecnicos-service`)**: `MongoAdapter` (`src/db/mongo.adapter.ts`) conectado ao **MongoDB Atlas (Free Tier)** com proteção contra NoSQL Injection.
   - **Microserviço 2 (`os-service`)**: `AzureSqlAdapter` (`src/db/azuresql.adapter.ts`) conectado ao **Azure SQL Database (Free 1 DTU)** com queries T-SQL parametrizadas (`@p1..@pn`) e `OUTPUT INSERTED.*`.

📄 **Documentação Arc42 Completa (Seções 1 a 12):** [`ARC42.md`](./ARC42.md)

---

## 🧱 Detalhamento dos 2 Microsserviços e do Message Broker

### 🔹 Microserviço 1: `tecnicos-service` (MongoDB Atlas — Porta `:8082`)
- **Banco de Dados:** **MongoDB Atlas (Free Tier)** — Database `nexora_tecnicos`, Collection `tecnicos`.
- **Domínio:** Gestão de Técnicos de Campo, Especialidades, Regiões e Disponibilidade Operacional (`Disponível`, `Em Atendimento`, `Ausente`).
- **Endpoints CRUD Completo & Mensageria:**
  - `GET /api/tecnicos` (filtros: `especialidade`, `status`, `regiao`)
  - `GET /api/tecnicos/:id`
  - `POST /api/tecnicos`
  - `PUT /api/tecnicos/:id`
  - `PATCH /api/tecnicos/:id/disponibilidade`
  - `DELETE /api/tecnicos/:id`
  - `POST /api/tecnicos/eventos` & `GET /api/tecnicos/mensageria/status` (Consumidor **Azure Service Bus**)
- **Swagger Documentado:** `http://localhost:8082/api-docs` (`/api-docs.json`)

### 🔹 Microserviço 2: `os-service` (Azure SQL Database — Porta `:8081`)
- **Banco de Dados:** **Azure SQL Database (Free 1 DTU)** — Tabela `dbo.ordens_servico`.
- **Domínio:** Gestão de Ordens de Serviço, Prioridades, Prazos, Valores e Ciclo de Vida.
- **Endpoints CRUD Completo & Mensageria:**
  - `GET /api/ordens` (filtros: `status`, `prioridade`, `cliente`)
  - `GET /api/ordens/:id`
  - `POST /api/ordens`
  - `PUT /api/ordens/:id`
  - `PATCH /api/ordens/:id/status`
  - `DELETE /api/ordens/:id`
  - `GET /api/ordens/mensageria/status` (Publicador **Azure Service Bus**)
- **Swagger Documentado:** `http://localhost:8081/api-docs` (`/api-docs.json`)

### 🔄 Regra de Negócio via Broker (Azure Service Bus — Fila `nexora-ordens-eventos`)
- Quando uma Ordem de Serviço é criada ou atualizada no `os-service` (**Azure SQL**) com um técnico atribuído (`Agendada` ou `Em Execução`), o `os-service` publica um evento na fila `nexora-ordens-eventos` do **Azure Service Bus**.
- O `tecnicos-service` (**MongoDB Atlas**) consome o evento e atualiza automaticamente o status do técnico para `"Em Atendimento"`.
- Quando a Ordem de Serviço transiciona para `"Concluída"` ou `"Cancelada"`, o `os-service` publica o evento de liberação e o `tecnicos-service` altera o status do técnico de volta para `"Disponível"`.

---

## 🚀 Como Rodar Localmente

```bash
# 1. Instalar dependências dos 2 microsserviços
npm --prefix os-service install
npm --prefix tecnicos-service install

# 2. Configurar variáveis de ambiente (ou usar o fallback autônomo embutido)
cp os-service/.env.example os-service/.env
cp tecnicos-service/.env.example tecnicos-service/.env

# 3. Iniciar ambos os microsserviços simultaneamente (:8081 e :8082)
npm run services:dev
```

---

## 🧪 Testes Unitários, Adversariais e de Arquitetura

```bash
# 1. Executar Testes Unitários/CRUD + Testes de Arquitetura (dependency-cruiser)
npm run test:backend

# 2. Executar Testes Individualmente
npm --prefix os-service test
npm --prefix tecnicos-service test

# 3. Executar Testes de Arquitetura (Isolamento Database-per-Service e Camadas)
npm --prefix TDE4-Testes-Arquitetura run test:backend
```
