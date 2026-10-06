# NEXORA - Field Service ERP (Micro-Frontends)

**Atividade Formativa 13 - Arquitetura em Nuvem & Micro-Frontends**

Este repositório contém a implementação da arquitetura de Micro-Frontends (MFE) para o sistema **NEXORA**, um ERP modular voltado para Gestão de Serviços de Campo (*Field Service Management*). A solução utiliza **React 18** e **Webpack 5 Module Federation**, configurada e implantada em quatro instâncias totalmente independentes no **Azure Web Apps**.

---

## 👥 Integrantes do Grupo

- **Éden Samuel**
- **Fernando Lopes**
- **Felipe Carneiro**
- **Henrique Ricardo**
- **Hugo Takeda**

---

## 🏗️ Arquitetura de 4 Micro-Frontends Independentes

A aplicação é subdividida em 4 projetos completamente separados e desacoplados:

1. **Remote 1 (`/remote`) — MFE Abertura de Ordem de Serviço (Azure Web App 1)**:
   - Roda por padrão na **porta 3001** (local) ou em sua própria URL na Azure.
   - Expõe o módulo `./OrderForm` via **Module Federation**.
   - Contém exclusivamente o formulário de abertura e registro de OS.

2. **Remote 2 (`/remote-list`) — MFE Gestão & Listagem de OS (Azure Web App 2)**:
   - Roda por padrão na **porta 3002** (local) ou em sua própria URL na Azure.
   - Expõe o módulo `./OrderList` via **Module Federation**.
   - Contém a tabela de monitoramento, filtros por status e botões de ação para alterar a situação das OS.

3. **Remote 3 (`/remote-dashboard`) — MFE Dashboard & Analytics (Azure Web App 3)**:
   - Roda por padrão na **porta 3003** (local) ou em sua própria URL na Azure.
   - Expõe o módulo `./Dashboard` via **Module Federation**.
   - Exibe os indicadores estratégicos (KPIs), faturamento, taxa de conclusão e gráficos por prioridade e técnico.

4. **Host Container (`/host`) — Shell Application (Azure Web App 4)**:
   - Roda por padrão na **porta 3000** (local) ou em sua própria URL na Azure.
   - Atua como o container principal (Shell) do NEXORA ERP, integrando os 3 MFEs Remotos (`remote/OrderForm`, `remoteList/OrderList` e `remoteDashboard/Dashboard`) com `React.lazy`, `React.Suspense` e `ErrorBoundary`.

---

## 🌐 4 URLs Públicas Independentes (Azure Web Apps - Canadá Central)

1. ⚡ **MFE 1 (Abertura de OS)**: [https://nexora-remote-fernando.azurewebsites.net](https://nexora-remote-fernando.azurewebsites.net)
2. 📋 **MFE 2 (Gestão & Tabela de OS)**: [https://nexora-remote2-fernando.azurewebsites.net](https://nexora-remote2-fernando.azurewebsites.net)
3. 📊 **MFE 3 (Dashboard & Analytics)**: [https://nexora-remote3-fernando.azurewebsites.net](https://nexora-remote3-fernando.azurewebsites.net)
4. 🏗️ **Host Shell (Container Principal)**: [https://nexora-host-fernando.azurewebsites.net](https://nexora-host-fernando.azurewebsites.net)

---

## 📁 Estrutura do Repositório

```text
NEXORA(Arquitetura Claud)/
├── host/                     # Host Shell Container (Porta 3000)
├── remote/                   # MFE 1: Abertura de OS (Porta 3001)
├── remote-list/              # MFE 2: Gestão & Tabela de OS (Porta 3002)
├── remote-dashboard/         # MFE 3: Dashboard & Analytics (Porta 3003)
├── GRUPO.md
├── README.md
├── .gitignore
└── package.json
```

---

## 🚀 Como Executar Localmente

```bash
# MFE 1 - Remote 1 (Porta 3001)
cd remote && npm install && npm run dev

# MFE 2 - Remote 2 (Porta 3002)
cd remote-list && npm install && npm run dev

# MFE 3 - Remote 3 (Porta 3003)
cd remote-dashboard && npm install && npm run dev

# Host Shell Container (Porta 3000)
cd host && npm install && npm run dev
```
