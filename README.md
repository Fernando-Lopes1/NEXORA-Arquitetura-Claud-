# NEXORA - Field Service ERP (Micro-Frontends)

**Atividade Formativa 13 - Arquitetura em Nuvem & Micro-Frontends**

Este repositório contém a implementação da arquitetura de Micro-Frontends (MFE) para o sistema **NEXORA**, um ERP modular voltado para Gestão de Serviços de Campo (*Field Service Management*). A solução utiliza **React 18** e **Webpack 5 Module Federation**, configurada e implantada em três instâncias independentes no **Azure Web Apps**.

---

## 👥 Integrantes do Grupo

- **Éden Samuel**
- **Fernando Lopes**
- **Felipe Carneiro**
- **Henrique Ricardo**
- **Hugo Takeda**

---

## 🏗️ Arquitetura de Micro-Frontends (MFE)

A aplicação é subdividida em três projetos independentes e desacoplados:

1. **Remote 1 (`/remote`) — Micro-frontend de Ordens de Serviço (Azure Web App 1)**:
   - Roda por padrão na **porta 3001** (local) ou em sua própria URL na Azure.
   - Expõe o módulo `./OrderForm` via **Module Federation**.
   - Permite a abertura e registro completo de Ordens de Serviço com validação visual de campos.

2. **Remote 2 (`/remote-dashboard`) — Micro-frontend de Dashboard & Analytics (Azure Web App 2)**:
   - Roda por padrão na **porta 3002** (local) ou em sua própria URL na Azure.
   - Expõe o módulo `./Dashboard` via **Module Federation**.
   - Exibe indicadores estratégicos (KPIs), taxa de conclusão, volume financeiro R$, distribuição por status/prioridade e carga por técnico.

3. **Host (`/host`) — Container Principal / Shell Application (Azure Web App 3)**:
   - Roda por padrão na **porta 3000** (local) ou em sua própria URL na Azure.
   - Atua como a casca (Shell) principal do NEXORA ERP, integrando dinamicamente ambos os MFEs Remotos (`remote/OrderForm` e `remoteDashboard/Dashboard`) com `React.lazy`, `React.Suspense` e `ErrorBoundary`.
   - Oferece navegação por abas para alternar entre os módulos remotos hospedados de forma independente.

---

## 🌐 URLs Públicas (Azure Web Apps - Canadá Central)

- **Host Shell Application**: [https://nexora-host-fernando.azurewebsites.net](https://nexora-host-fernando.azurewebsites.net)
- **Remote 1 (Ordens de Serviço)**: [https://nexora-remote-fernando.azurewebsites.net](https://nexora-remote-fernando.azurewebsites.net)
- **Remote 2 (Dashboard & Analytics)**: [https://nexora-dashboard-fernando.azurewebsites.net](https://nexora-dashboard-fernando.azurewebsites.net)

---

## 📁 Estrutura do Repositório

```text
NEXORA(Arquitetura Claud)/
├── host/                     # App Shell Container (Porta 3000)
├── remote/                   # MFE 1: Ordens de Serviço (Porta 3001)
├── remote-dashboard/         # MFE 2: Dashboard & Analytics (Porta 3002)
├── GRUPO.md
├── README.md
├── .gitignore
└── package.json
```

---

## 🚀 Como Executar Localmente

```bash
# Terminal 1 - Remote 1 (Porta 3001)
cd remote && npm install && npm run dev

# Terminal 2 - Remote 2 (Porta 3002)
cd remote-dashboard && npm install && npm run dev

# Terminal 3 - Host Shell (Porta 3000)
cd host && npm install && npm run dev
```
