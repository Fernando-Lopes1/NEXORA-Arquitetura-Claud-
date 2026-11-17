# FORMATIVA 19 — Guia Prático: Consultoria ATAM Cruzada (Peer Review)

Guia direto, conciso e objetivo para a dinâmica de avaliação arquitetural do **NEXORA**.

---

## 👥 Equipe NEXORA
- **Éden Samuel**, **Fernando Lopes**, **Felipe Carneiro**, **Henrique Ricardo**, **Hugo Takeda**

---

## 🗣️ 1. O Pitch de 3 Minutos (O que falar para o outro grupo)

> "O **NEXORA** é um ERP em nuvem para **gestão de técnicos de campo e ordens de serviço** (instalações e reparos externos).
>
> A arquitetura é dividida em **3 partes**:
>
> 1. **Frontend (Micro-Frontends):** Duas aplicações React independentes (uma para abertura de OS e outra para Dashboard de BI).
> 2. **Camada de Perímetro (API Gateway & BFF em Laravel 11):** Ponto único de entrada. Resolve CORS, injeta rastreabilidade (`X-Correlation-Id`) e agrega respostas para a tela não precisar fazer dezenas de requisições lentas.
> 3. **Backend (Microsserviços com Database-per-Service):** 
>    - `os-service` (cuida apenas das ordens).
>    - `tecnicos-service` (cuida apenas dos técnicos e agendas).
>
> Para manter os dados seguros entre serviços diferentes sem travar o banco, usamos o **Padrão Saga**: se a criação da OS falhar ou o técnico estiver indisponível, o sistema desfaz a operação automaticamente (rollback lógico via compensação) e grava tudo em um log de eventos (*Event Sourcing*).
>
> **O foco da avaliação hoje:** Como o sistema se comporta sob falhas e conflitos de agendamento usando a Saga."

---

## 🗺️ 2. Diagrama Arquitetural Simplificado

```text
[ Telas em React (MFE) ]
           │ 
           ▼  (1 chamada HTTP agregada)
[ API Gateway & BFF em Laravel (:8080) ]
     ├── Centraliza CORS e Correlation ID
     ├── Orquestrador da SAGA (Compensação em caso de erro)
     │
     ├───> [ os-service (:8081) ] ──────> [ Banco SQLite OS ]
     └───> [ tecnicos-service (:8082) ] ──> [ Banco SQLite Técnicos ]
```

---

## 🌳 3. Árvore Utilitária (ISO/IEC 25010)

Matriz de priorização: **(Importância de Negócio, Dificuldade Técnica)**

```text
                                [ QUALIDADE DO NEXORA ]
                                           │
         ┌───────────────────┬─────────────┴─────────────┬────────────────────┐
         ▼                   ▼                           ▼                    ▼
   [Desempenho]       [Confiabilidade]           [Manutenibilidade]      [Segurança]
         │                   │                           │                    │
    Composição            Saga &                     Evolução de         Rastreabilidade
    no Gateway          Rollbacks                   Microsserviços       Correlation-ID
         │                   │                           │                    │
     Cenário 1           Cenário 2                   Cenário 3            Cenário 4
    (Alta, Média)       (Alta, Alta) ⭐            (Média, Média)       (Alta, Baixa)
```

* **Cenário 1 (Desempenho):** Carregamento rápido do Dashboard via BFF agregador.
* **Cenário 2 (Confiabilidade) ⭐ [FOCO]:** Falha ao alocar técnico e execução de rollback pela Saga.
* **Cenário 3 (Manutenibilidade):** Trocar ou atualizar um microsserviço sem alterar o frontend.
* **Cenário 4 (Segurança):** Rastrear requisições em todos os serviços usando `X-Correlation-Id`.

---

## 🎯 4. Anatomia do Cenário Crítico (Os 6 Passos ATAM)

| Elemento | Descrição Prática |
| :--- | :--- |
| **1. Fonte** | Atendente ou despachante operacional abrindo uma OS. |
| **2. Estímulo** | Submissão de uma OS escolhendo um técnico que já está ocupado ou indisponível. |
| **3. Ambiente** | Horário comercial normal com tráfego simultâneo. |
| **4. Artefato** | API Gateway, Orquestrador da Saga e `tecnicos-service`. |
| **5. Resposta** | O Gateway detecta a recusa (HTTP 409), cancela a OS pré-reservada (rollback) e devolve mensagem clara ao atendente. |
| **6. Medida** | **Zero OS órfãs perdidas no banco** e rollback concluído em **menos de 1 segundo**. |

---

## ⚖️ 5. O Parecer Técnico (Para o Relatório da Consultoria)

As 3 respostas fundamentais que a consultoria deve registrar:

### 1. Ponto de Sensibilidade
* **Onde:** No **BFF do Gateway**.
* **Por quê:** Como o Gateway faz a composição das telas, o tempo de resposta do sistema depende diretamente da velocidade com que o Gateway consegue falar com os dois microsserviços.

### 2. Trade-off (Compensação)
* **Decisão:** **Microsserviços com Saga** *versus* **Monolito com Banco Único**.
  * **Ganho (+):** Serviços independentes, facilidade de deploy e bancos de dados isolados.
  * **Perda (-):** Maior complexidade para garantir consistência e necessidade de programar rollbacks manuais (não há transação de banco unificada).

### 3. Risco Arquitetural
* **O Risco:** **Queda em cascata no Gateway por lentidão de um microsserviço.**
* **Impacto:** Se o `tecnicos-service` travar, o Gateway pode segurar conexões esperando timeout e travar todo o sistema.
* **Mitigação:** Adicionar **Circuit Breaker** (disjuntor de segurança) e timeouts curtos (máx. 1.5s) com resposta de contingência (*fallback*).

---

## ⏱️ Roteiro da Reunião (60 Minutos)

1. **00–15 min:** Ler/explicar a Seção 1 (Pitch) e mostrar o diagrama.
2. **15–35 min:** O outro grupo faz perguntas e valida o Cenário Crítico (Seção 4).
3. **35–50 min:** O outro grupo anota o Ponto Sensível, Trade-off e Risco (Seção 5).
4. **50–60 min:** Fechamento e cópia dos dados para as Seções 10 e 11 do relatório arc42.
