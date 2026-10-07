# NEXORA - Field Service ERP (Micro-Frontends)

**Atividade Formativa 13 - Arquitetura em Nuvem & Micro-Frontends**

Este repositório contém a implementação da arquitetura de Micro-Frontends (MFE) para o sistema **NEXORA**, um ERP modular voltado para Gestão de Serviços de Campo (*Field Service Management*). A solução utiliza **React 18** e **Webpack 5 Module Federation**, organizada em **2 Pares Independentes (2 Hosts e 2 Remotes)**, gerando **4 links totalmente desacoplados no Azure Web Apps**.

---

## 👥 Integrantes do Grupo

- **Éden Samuel**
- **Fernando Lopes**
- **Felipe Carneiro**
- **Henrique Ricardo**
- **Hugo Takeda**

---

## 🏗️ Arquitetura dos 2 Pares de Micro-Frontends (4 Links Azure)

### 🟢 PAR 1: Módulo de Gestão de Ordens de Serviço (Links 1 e 2)
1. **Remote 1 (`/remote`) — MFE Formulario de OS**:
   - Roda na **porta 3001** (local) ou em sua própria URL na Azure.
   - Expõe exclusivamente o módulo `./OrderForm` via **Module Federation**.
   - Contém formulário completo de Abertura de Ordem de Serviço com validação de campos.
   - ⚡ **Azure Link 1**: [https://nexora-remote-fernando.azurewebsites.net](https://nexora-remote-fernando.azurewebsites.net)

2. **Host 1 (`/host`) — Controller Shell de Gestão de OS**:
   - Roda na **porta 3000** (local) ou em sua própria URL na Azure.
   - Atua como a casca (Shell) do módulo de Ordens de Serviço, consumindo o MFE `remote/OrderForm` e mantendo a listagem/controle em tempo real.
   - 🏗️ **Azure Link 2**: [https://nexora-host-fernando.azurewebsites.net](https://nexora-host-fernando.azurewebsites.net)

---

### 🔵 PAR 2: Módulo de Dashboard & Analytics (Links 3 e 4)
3. **Remote 2 (`/remote-dashboard`) — MFE Dashboard & KPIs**:
   - Roda na **porta 3002** (local) ou em sua própria URL na Azure.
   - Expõe exclusivamente o módulo `./Dashboard` via **Module Federation**.
   - Exibe indicadores estratégicos (KPIs), taxa de conclusão, volume financeiro R$ e gráficos.
   - 📊 **Azure Link 3**: [https://nexora-remote-dashboard-fernando.azurewebsites.net](https://nexora-remote-dashboard-fernando.azurewebsites.net) *(ou `nexora-remote2-fernando`)*

4. **Host 2 (`/host-dashboard`) — Controller Shell do Dashboard**:
   - Roda na **porta 3004** (local) ou em sua própria URL na Azure.
   - Atua como a casca (Shell) executiva, consumindo o MFE `remoteDashboard/Dashboard` com resiliência.
   - 🏗️ **Azure Link 4**: [https://nexora-host-dashboard-fernando.azurewebsites.net](https://nexora-host-dashboard-fernando.azurewebsites.net) *(ou `nexora-host2-fernando`)*

---

## 📁 Estrutura de Diretórios do Repositório

```text
NEXORA(Arquitetura Claud)/
├── host/                     # Host Shell 1 - Gestão de OS (Porta 3000)
├── remote/                   # Remote MFE 1 - Formulário de OS (Porta 3001)
├── host-dashboard/           # Host Shell 2 - Dashboard (Porta 3004)
├── remote-dashboard/         # Remote MFE 2 - Dashboard (Porta 3002)
├── GRUPO.md
├── README.md
├── .gitignore
└── package.json
```

---

## 🚀 Como Executar Localmente

```bash
# === PAR 1 (Gestão de OS) ===
# Terminal 1 - Remote 1 (Porta 3001)
cd remote && npm install && npm run dev

# Terminal 2 - Host 1 (Porta 3000)
cd host && npm install && npm run dev

# === PAR 2 (Dashboard) ===
# Terminal 3 - Remote 2 (Porta 3002)
cd remote-dashboard && npm install && npm run dev

# Terminal 4 - Host 2 (Porta 3004)
cd host-dashboard && npm install && npm run dev
```

---

