# Contexto & Situação Atual do Projeto — NEXORA (Arquitetura em Cloud)

Este arquivo resume o estado atual da solução distribuída **NEXORA** para continuidade rápida em qualquer máquina ou sessão.

## 1. Repositório Principal
- **GitHub:** `Fernando-Lopes1/NEXORA-Arquitetura-Claud-` (branch `main`)

## 2. Arquitetura & Serviços na Nuvem (Azure - `rg-nexora-ca`)
- **Microfrontend Principal (Host OS + Aba Técnicos/BI):** `https://nexora-host-fernando.azurewebsites.net`
- **Microfrontend Dashboard BI (Host BI):** `https://nexora-host-dashboard-fernando.azurewebsites.net`
- **API Gateway & BFF (Laravel/PHP):** `https://nexora-gateway-fernando.azurewebsites.net/api/bff/status`
- **Microserviço OS (`os-service`):** `https://nexora-remote-fernando.azurewebsites.net/health`
- **Microserviço Técnicos (`tecnicos-service`):** `https://nexora-remote-dashboard-fernando.azurewebsites.net/health`

## 3. Bancos de Dados & Mensageria Configurados
- **Azure SQL Database:** `nexora-database.database.windows.net` / banco `nexora-sql-srv-fernando` (`os-service/.env` e App Service `nexora-remote-fernando`)
- **MongoDB Atlas:** cluster `ong.zm6tt.mongodb.net` / banco `nexora_tecnicos` (`tecnicos-service/.env` e App Service `nexora-remote-dashboard-fernando`)
- **Azure Service Bus:** namespace `nexora-bus-fernando.servicebus.windows.net` / fila `nexora-ordens-eventos`
*(As credenciais locais ficam apenas nos arquivos `.env`, nunca versionados no Git.)*

## 4. O que já está pronto
- Microfrontends (React + Module Federation) unificados em abas no Host principal (`host/src/App.jsx`).
- API Gateway & BFF (Laravel) com agregação, proxy CRUD, CORS, Swagger e observabilidade.
- Microsserviços `os-service` e `tecnicos-service` com Clean/Hexagonal Architecture, CRUD completo, Swagger e integração Azure SQL / MongoDB Atlas / Service Bus.
- Testes unitários e testes de arquitetura (`npm run test:complete`).
- Documentação `README.md` e `docs/ARC42.md`.

## 5. O que falta para a entrega final
1. Subir o vídeo no YouTube (**Não listado**) com todos os integrantes de câmera aberta demonstrando o sistema na nuvem.
2. Inserir o link do vídeo (e conferir os nomes dos alunos) no `README.md` e fazer o `git push` final.
