# 🌐 NEXORA — API Gateway & BFF (Fase 2)

> **Disciplina de Arquitetura de Soluções / Arquitetura de Software**  
> Projeto independente para implementação da **Camada de Interface do Backend**, aplicando os padrões **API Gateway (Reverse Proxy Transparente)** e **Backend For Frontend (BFF Concorrente)** construído com **PHP 8.2 e Laravel 11**.

---

## 👥 Integrantes do Grupo

- **Éden Samuel**
- **Fernando Lopes**
- **Felipe Carneiro**
- **Henrique Ricardo**
- **Hugo Takeda**

*Arquivo oficial de integrantes:* [GRUPO.md](file:///d:/Faculdade/nexora-gateway-laravel/GRUPO.md)

---

## 🌐 Endereços Oficiais em Produção no Microsoft Azure

| Componente | Plataforma / Serviço | URL Pública de Produção | Descrição / Papel Arquitetural |
|---|---|---|---|
| ⚡ **API Gateway & BFF (Novo)** | Azure Web App (PHP 8.2) | [https://nexora-gateway-fernando.azurewebsites.net](https://nexora-gateway-fernando.azurewebsites.net) | **Ponto Único de Entrada**, Proxy Reverso, Rastreabilidade (`X-Correlation-Id`) e Agregação BFF |
| 🟢 **Frontend MFE 1** | Azure Web App / Shell | [https://nexora-host-fernando.azurewebsites.net](https://nexora-host-fernando.azurewebsites.net) | Shell e MFE de Abertura e Gestão de Ordens de Serviço |
| 🔵 **Frontend MFE 2** | Azure Web App / Shell | [https://nexora-host-dashboard-fernando.azurewebsites.net](https://nexora-host-dashboard-fernando.azurewebsites.net) | Shell e MFE de BI Executivo com Indicadores Analíticos |
| 📦 **Microsserviço 1** | Azure Web App (Node/OS) | [https://nexora-remote-fernando.azurewebsites.net](https://nexora-remote-fernando.azurewebsites.net) | CRUD autônomo de Ordens de Serviço (`os-service`) |
| 📦 **Microsserviço 2** | Azure Web App (Node/Técnicos) | [https://nexora-remote-dashboard-fernando.azurewebsites.net](https://nexora-remote-dashboard-fernando.azurewebsites.net) | CRUD autônomo de Técnicos de Campo (`tecnicos-service`) |

*Repositório Público no GitHub (para entrega no AVA):*  
👉 **[https://github.com/Fernando-Lopes1/NEXORA-GATEWAY-LARAVEL](https://github.com/Fernando-Lopes1/NEXORA-GATEWAY-LARAVEL)**

---

## 🎯 Contexto e Narrativa Pedagógica: Antes vs. Depois

Este repositório foi construído como um **projeto isolado e independente** para evidenciar o contraste pedagógico entre as etapas de amadurecimento arquitetural:

```text
========================================================================================
FASE 1: ACESSO DIRETO (Marco Zero - Sem Gateway)
========================================================================================

  [ MFE Gestão de OS :3000 ]        ─────────────>  [ os-service :8081 ]
                                                   (CORS individual, porta exposta)

  [ MFE Dashboard BI :3004 ]        ─────────────>  [ tecnicos-service :8082 ]
                                                   (CORS individual, porta exposta)

  ❌ Problemas da Fase 1:
     1. Acoplamento Excessivo: Frontend precisa conhecer URL, IP e porta de cada API.
     2. CORS Fragmentado: Toda mudança de origem exige alteração manual em cada microsserviço.
     3. Fragilidade Operacional: Mudar uma porta downstream quebra o código cliente.
     4. Chatty I/O: Para montar uma tela rica, o navegador dispara dezenas de chamadas (N+1).

========================================================================================
FASE 2: API GATEWAY & BFF CENTRALIZADO (:8080)
========================================================================================

  [ MFE Gestão de OS :3000 ] ──┐
  [ MFE Dashboard BI :3004 ] ──┼──> [ API GATEWAY & BFF (:8080) ]
  [ Clientes Mobile / Web  ] ──┘    │
                                    ├─ CORS Centralizado no config/cors.php
                                    ├─ Logs e Rastreabilidade Distribuída (X-Correlation-Id)
                                    ├─ Agregação Paralela Concorrente (Http::pool)
                                    │
                                    ├───> /api/ordens/**    ──> [ os-service :8081 ]
                                    ├───> /api/tecnicos/**  ──> [ tecnicos-service :8082 ]
                                    └───> /api/bff/**       ──> [ Composição de Dados em Memória ]

  ✅ Benefícios da Fase 2:
     1. Ponto Único de Entrada: O frontend se comunica exclusivamente com a porta :8080.
     2. Microsserviços 100% Intactos: os-service e tecnicos-service permanecem inalterados.
     3. Resiliência e Auditoria: Header X-Correlation-Id e tempo de execução injetados centralmente.
     4. BFF de Baixa Latência: 1 request HTTP do browser = 2 chamadas paralelas no backend.
========================================================================================
```

---

## 📊 Tabela Comparativa: Fase 1 vs. Fase 2

| Característica | Fase 1 (Microsserviços Isolados) | Fase 2 (Com API Gateway & BFF em Laravel) |
| :--- | :--- | :--- |
| **Ponto de Acesso do Frontend** | Múltiplos (`:8081`, `:8082`, etc.) | **Único (`http://localhost:8080` ou URL do Azure)** |
| **Configuração de CORS** | Espalhada em cada microsserviço | **Centralizada e unificada em `config/cors.php`** |
| **Rastreabilidade Distribuída** | Inexistente / Desconectada | **Header `X-Correlation-Id` (UUID v4) injetado em todas as requisições** |
| **Telemetria de Execução** | Logs manuais desconexos | **Header `X-Gateway-Execution-Time-Ms` com medição precisa** |
| **Montagem de Telas Complexas** | Múltiplos requests pelo browser (*Chatty I/O*) | **1 chamada agregada ao BFF via `Http::pool` não-bloqueante** |
| **Código dos Microsserviços** | Base | **100% INTACTO (nenhuma alteração necessária)** |

---

## 🛠️ Stack Tecnológica

- **Linguagem:** PHP 8.2+
- **Framework:** Laravel 11 / 12
- **Motor HTTP / Proxy:** Guzzle HTTP Client + `Http::pool` (execução assíncrona concorrente)
- **Middlewares:** `GatewayTelemetryMiddleware` (injetor de UUID, timer de latência e cabeçalhos de auditoria)
- **Hospedagem em Nuvem:** Microsoft Azure Web Apps (Linux App Service, região Canadá Central)
- **Servidor Web:** Nginx + PHP-FPM

---

## 🛣️ Mapeamento de Rotas e Endpoints

### 1. Rotas de Proxy Reverso (Transparentes)

Encaminham requisições de forma transparente, preservando verbos HTTP, query strings, headers e payload JSON:

| Requisição no Gateway (:8080) | Microsserviço Destino | Responsabilidade |
| :--- | :--- | :--- |
| `GET /api/ordens` | `os-service` (:8081) | Listar ordens com filtros opcionais |
| `GET /api/ordens/{id}` | `os-service` (:8081) | Detalhes de uma ordem de serviço |
| `POST /api/ordens` | `os-service` (:8081) | Cadastrar nova ordem de serviço |
| `PUT /api/ordens/{id}` | `os-service` (:8081) | Atualizar dados cadastrais da OS |
| `PATCH /api/ordens/{id}/status` | `os-service` (:8081) | Transição de status da OS |
| `DELETE /api/ordens/{id}` | `os-service` (:8081) | Remover ordem de serviço |
| `GET /api/tecnicos` | `tecnicos-service` (:8082) | Listar técnicos de campo |
| `GET /api/tecnicos/{id}` | `tecnicos-service` (:8082) | Detalhes de um técnico |
| `POST /api/tecnicos` | `tecnicos-service` (:8082) | Cadastrar novo técnico |
| `PUT /api/tecnicos/{id}` | `tecnicos-service` (:8082) | Atualizar técnico |
| `DELETE /api/tecnicos/{id}` | `tecnicos-service` (:8082) | Remover técnico |

> **Headers Injetados pelo Gateway em cada resposta:**
> - `X-Correlation-Id: <uuid_v4>`
> - `X-Gateway-Processed-By: NEXORA-Laravel-API-Gateway`
> - `X-Gateway-Route: os-service` ou `tecnicos-service`
> - `X-Gateway-Execution-Time-Ms: <latencia_em_ms>`

---

### 2. Endpoints Especializados do BFF (Backend For Frontend)

| Endpoint no Gateway (:8080) | Padrão Aplicado | Descrição Didática |
| :--- | :--- | :--- |
| `GET /api/bff/dashboard` | **Data Aggregation (Concorrente)** | Dispara consultas assíncronas paralelas via `Http::pool()` para `os-service` e `tecnicos-service`, consolidando total de OS, distribuição por status, técnicos disponíveis e status de conectividade em 1 só resposta. |
| `GET /api/bff/ordens-com-tecnicos` | **Service Composition** | Realiza a busca paralela e cruza em memória as Ordens de Serviço com o objeto completo do seu respectivo Técnico responsável (elimina o problema de *Chatty I/O*). |
| `GET /api/bff/status` | **Architecture Status** | Informa a topologia das rotas ativas, portas configuradas e status dos microsserviços dependentes. |
| `GET /api/health` | **Health Check** | Verificação de integridade e prontidão do Gateway. |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- PHP 8.2 ou superior instalado
- Composer instalado
- (Opcional) Microsserviços `os-service` (:8081) e `tecnicos-service` (:8082) rodando

### Passo a Passo

```bash
# 1. Entrar na pasta do projeto
cd nexora-gateway-laravel

# 2. Instalar dependências (caso seja clonado do zero)
composer install

# 3. Gerar a chave de aplicação (se ainda não existir)
php artisan key:generate

# 4. Iniciar o servidor Gateway na porta 8080
php artisan serve --port=8080
```

Pronto! Acesse o navegador em:  
👉 **[http://localhost:8080](http://localhost:8080)** para acessar o **Console Interativo Visual** do Gateway!

---

## 🧪 Testando os Endpoints via cURL

### 1. Testar Agregação do Dashboard (BFF)
```bash
curl -i http://localhost:8080/api/bff/dashboard
```

### 2. Testar Composição de Entidades (BFF)
```bash
curl -i http://localhost:8080/api/bff/ordens-com-tecnicos
```

### 3. Testar Proxy Reverso de Ordens
```bash
curl -i http://localhost:8080/api/ordens
```
*Note nos cabeçalhos de resposta HTTP os headers `X-Correlation-Id` e `X-Gateway-Route: os-service`.*

### 4. Testar Proxy Reverso de Técnicos
```bash
curl -i http://localhost:8080/api/tecnicos
```

---

## ☁️ Publicação no Microsoft Azure (Azure Web Apps)

### Provisionamento via Azure Cloud Shell (Canadá Central)

Abra o Cloud Shell no [Portal Azure](https://portal.azure.com) e execute:

```bash
# 1. Cria a aplicação Web App com runtime PHP 8.2 no plano do Canadá Central
az webapp create \
  --resource-group rg-nexora-ca \
  --plan nexora-plan \
  --name nexora-gateway-fernando \
  --runtime "PHP:8.2"

# 2. Configura o Nginx para servir a pasta /public do Laravel
az webapp config set \
  --resource-group rg-nexora-ca \
  --name nexora-gateway-fernando \
  --startup-file "cp /home/site/wwwroot/default /etc/nginx/sites-available/default && service nginx reload"

# 3. Configura as variáveis de ambiente com os microsserviços em produção
az webapp config appsettings set \
  --resource-group rg-nexora-ca \
  --name nexora-gateway-fernando \
  --settings \
    APP_ENV=production \
    APP_DEBUG=false \
    OS_SERVICE_URL="https://nexora-remote-fernando.azurewebsites.net" \
    TECNICOS_SERVICE_URL="https://nexora-remote-dashboard-fernando.azurewebsites.net"
```
