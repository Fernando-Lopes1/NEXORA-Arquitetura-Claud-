# Integrantes do Grupo — NEXORA (Arquitetura em Nuvem)

**Disciplina**: Arquitetura de Soluções em Nuvem  
**Projeto**: Ecossistema ERP NEXORA — Gestão de Serviços de Campo (*Field Service Management*)  
**Entregas Contempladas**:
- **Atividade Formativa 13**: Arquitetura de Micro-Frontends (React 18 & Webpack 5 Module Federation — 2 Hosts e 2 Remotes na Azure)
- **Atividade Formativa 14**: Arquitetura de Microsserviços (`os-service` e `tecnicos-service`) com Database-per-Service, Swagger/OpenAPI e Azure CI/CD
- **Atividade Formativa 15**: Arquitetura Limpa, MVC (PHP 8.3 / Laravel 11), Princípios SOLID, CQRS & Estudo de Caso *FinPay Core*
- **Atividade Formativa 16**: API Gateway, Backend for Frontend (BFF), CORS Centralizado, Observabilidade & Deploy Azure
- **Atividade Formativa 17**: Arquitetura Orientada a Eventos (EDA), Event Sourcing, DDD (Estratégico e Tático) & Saga Pattern

---

## 👥 Membros da Equipe

1. **Éden Samuel**
2. **Fernando Lopes**
3. **Felipe Carneiro**
4. **Henrique Ricardo**
5. **Hugo Takeda**

---

## 🔗 Links Oficiais de Produção no Microsoft Azure (`rg-nexora-ca`)

| Aplicação / Serviço | Papel Arquitetural | Porta Local | URL no Microsoft Azure |
| :--- | :--- | :---: | :--- |
| **API Gateway & BFF** | Ponto Único de Entrada, Reverse Proxy, BFF, MVC, CQRS, Event Store & Saga | `:8080` | [https://nexora-gateway-api.azurewebsites.net](https://nexora-gateway-api.azurewebsites.net) |
| **Host Shell 1 (`/host`)** | Controller Shell de Gestão de Ordens de Serviço (Par 1) | `:3000` | [https://nexora-host-fernando.azurewebsites.net](https://nexora-host-fernando.azurewebsites.net) |
| **Remote MFE 1 / `os-service`** | Micro-Frontend Formulário de OS (`./OrderForm`) / Microsserviço 1 (`os-service`) | `:3001` / `:8081` | [https://nexora-remote-fernando.azurewebsites.net](https://nexora-remote-fernando.azurewebsites.net) |
| **Remote MFE 2 / `tecnicos-service`** | Micro-Frontend Dashboard & KPIs (`./Dashboard`) / Microsserviço 2 (`tecnicos-service`) | `:3002` / `:8082` | [https://nexora-remote-dashboard-fernando.azurewebsites.net](https://nexora-remote-dashboard-fernando.azurewebsites.net) |
| **Host Shell 2 (`/host-dashboard`)** | Controller Shell Executivo de Business Intelligence (Par 2) | `:3004` | [https://nexora-host-dashboard-fernando.azurewebsites.net](https://nexora-host-dashboard-fernando.azurewebsites.net) |
