# NEXORA — Projeto 2: API Gateway & BFF (Laravel 11 / PHP 8.3, Clean Architecture, SOLID & CQRS)

Repositório oficial do **API Gateway & BFF (Backend for Frontend)** do ecossistema **NEXORA — Field Service Management**, desenvolvido para a disciplina de **Arquitetura de Soluções em Nuvem** na **Microsoft Azure**.

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
> *Demonstração em nuvem (Microsoft Azure) com câmera aberta por todos os integrantes mostrando as chamadas passando pelo API Gateway & BFF, agregação em único response e proxy CRUD refletindo nos bancos MongoDB Atlas e Azure SQL Database.*

---

## 🏛️ Arquitetura Utilizada e Separação em Camadas

O projeto utiliza **Clean Architecture + DDD + CQRS + SOLID**, dividida em camadas concêntricas e auditada automaticamente por **Pest Arch** (`TDE4-Testes-Arquitetura/gateway/GatewayArchTest.php`):

1. **Camada de Perímetro — API Gateway & BFF (`app/Gateway/`)**:
   - **Agregação de Dados em Único Response (`BffController` & `BffService`)**:
     - `GET /api/bff/visao-geral`: Consulta o **Microserviço 1 (`tecnicos-service` — MongoDB Atlas)** e o **Microserviço 2 (`os-service` — Azure SQL Database)**, agregando Ordens de Serviço, Técnicos, KPIs operacionais e o status do Broker **Azure Service Bus** em um **único response JSON**.
     - `GET /api/bff/dashboard`: Consolida métricas financeiras, distribuição por status/prioridade e carga por técnico.
     - `GET /api/bff/ordens/{id}`: Composição vertical combinando Ordem + Técnico + SLA + Valorização financeira.
   - **Proxy de Requisições CRUD (`GatewayProxyController`)**:
     - `/api/ordens/**` (`GET`, `POST`, `PUT`, `PATCH /concluir`, `DELETE`) -> Roteia para `os-service` (`:8081` — Azure SQL Database).
     - `/api/tecnicos/**` (`GET`, `POST`, `PUT`, `PATCH /disponibilidade`, `DELETE`) -> Roteia para `tecnicos-service` (`:8082` — MongoDB Atlas).
   - **Segurança, Centralização de Entrada, Roteamento e CORS (`app/Gateway/Middleware/`)**:
     - `CentralizedCorsMiddleware`: Centraliza as políticas de CORS para as origens dos Microfrontends locais e na nuvem Azure.
     - `CorrelationIdMiddleware`: Gera e propaga `X-Correlation-Id` para rastreamento distribuído.
     - `GatewayObservabilityMiddleware`: Injeta `X-Gateway-Processed-By`, `X-Gateway-Route` e `X-Gateway-Execution-Time-Ms`.
   - **Swagger Documentado (`GatewaySwaggerController`)**:
     - `GET /api-docs`: Interface interativa Swagger UI OpenAPI 3.0.
     - `GET /api/openapi.json`: Especificação completa OpenAPI 3.0.
2. **Camada de Domínio Puro (`app/Core/Domain/`)**:
   - Agregados (`OrdemServicoAggregate`), Value Objects imutáveis (`ValorMonetario`, `PrioridadeOrdem`, `StatusOrdem`), Domain Events e Anti-Corruption Layer (`OrdemLogisticaTranslator`) — sem dependência de framework.
3. **Camada de Aplicação CQRS & SOLID (`app/Core/Application/`)**:
   - `CommandBus` e `QueryBus`, Commands, Queries, Handlers e Strategies de precificação (`PricingStrategyInterface` — OCP/LSP/DIP).
4. **Camada de Infraestrutura & Saga (`app/Core/Infrastructure/`, `app/Core/Saga/`)**:
   - Repositórios, Event Store imutável (`SqliteEventStore`) e Orquestrador Saga com transações compensatórias (`OrquestradorSagaAberturaOS`).

📄 **Documentação Arc42 Completa (Seções 1 a 12):** [`ARC42.md`](./ARC42.md)

---

## 🌐 URL de Produção na Nuvem (Microsoft Azure)

- **API Gateway & BFF:** [https://nexora-gateway-api.azurewebsites.net](https://nexora-gateway-api.azurewebsites.net)
- **Swagger UI (OpenAPI 3.0):** [https://nexora-gateway-api.azurewebsites.net/api-docs](https://nexora-gateway-api.azurewebsites.net/api-docs)
- **Visão Geral Agregada (Único Response):** [https://nexora-gateway-api.azurewebsites.net/api/bff/visao-geral](https://nexora-gateway-api.azurewebsites.net/api/bff/visao-geral)

---

## 🚀 Como Rodar Localmente

```bash
# 1. Instalar dependências do Composer
composer install

# 2. Preparar banco local e popular seeds iniciais
touch database/database.sqlite
php artisan migrate:fresh --seed

# 3. Iniciar o API Gateway & BFF na porta 8080
php artisan serve --host=127.0.0.1 --port=8080
```

Acesse localmente:
- **Swagger UI:** `http://127.0.0.1:8080/api-docs`
- **OpenAPI JSON:** `http://127.0.0.1:8080/api/openapi.json`
- **Agregação BFF (Único Response):** `http://127.0.0.1:8080/api/bff/visao-geral`

---

## 🧪 Testes Unitários e Testes de Arquitetura

```bash
# Executar todos os 40 testes (Unitários DDD/SOLID + Feature Gateway/BFF/Swagger + 15 Testes de Arquitetura Pest Arch)
./vendor/bin/pest

# Executar apenas os Testes de Arquitetura (Clean Architecture, CQRS e SOLID)
./vendor/bin/pest TDE4-Testes-Arquitetura/gateway/GatewayArchTest.php
```
