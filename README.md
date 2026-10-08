# NEXORA - Field Service ERP (Micro-Frontends)

**Atividade Formativa 13 - Arquitetura em Nuvem & Micro-Frontends**

Este repositório contém a implementação da arquitetura de Micro-Frontends (MFE) para o sistema **NEXORA**, um ERP modular voltado para Gestão de Serviços de Campo (*Field Service Management*). A solução utiliza **React 18** e **Webpack 5 Module Federation**, organizada em **duas funcionalidades completas**, onde cada funcionalidade unifica o seu **Host** e o seu **Remote** sob um **único link de produção no Azure**, totalizando **2 links** com navegação por **Abas**.

---

## 👥 Integrantes do Grupo

- **Éden Samuel**
- **Fernando Lopes**
- **Felipe Carneiro**
- **Henrique Ricardo**
- **Hugo Takeda**

---

## 🌐 Links Públicos de Produção no Azure (2 Links Oficiais)

Em vez de 4 links separados, cada funcionalidade empacota e serve seu Host e seu Remote juntos sob um único domínio, oferecendo um seletor por **Abas** no topo da aplicação para alternar entre a **Visão Host (Shell Integrado via MFE)** e a **Visão Remote (MFE Standalone)**:

### 🟢 1. Funcionalidade 1 — Gestão de Ordens de Serviço (Host + Remote)
- 🔗 **Link Oficial do Azure**: [https://nexora-host-fernando.azurewebsites.net](https://nexora-host-fernando.azurewebsites.net)
- **O que contém neste link:**
  - **Aba 🏢 Visão Host (Shell Integrado)**: A aplicação Shell principal do NEXORA consumindo dinamicamente o componente remoto `remote/OrderForm` via Webpack Module Federation, acompanhado do painel e tabela de gestão de atendimentos em tempo real.
  - **Aba ⚡ Visão Remote (MFE Standalone)**: A interface autônoma do micro-frontend de abertura de OS, com seu próprio formulário e lista local de teste isolada.

---

### 🔵 2. Funcionalidade 2 — Dashboard & Analytics (Host + Remote)
- 🔗 **Link Oficial do Azure**: [https://nexora-host-dashboard-fernando.azurewebsites.net](https://nexora-host-dashboard-fernando.azurewebsites.net)
- **O que contém neste link:**
  - **Aba 🏢 Visão Host (Shell Executivo)**: A casca de Business Intelligence consumindo dinamicamente o componente remoto `remoteDashboard/Dashboard` via Webpack Module Federation com resiliência via ErrorBoundary e Suspense.
  - **Aba ⚡ Visão Remote (MFE Standalone)**: A interface autônoma do micro-frontend de métricas e KPIs analíticos operando em isolamento puro.

---

## 🏗️ Arquitetura Técnica de Micro-Frontends

A arquitetura adota o padrão de **Federation em Runtime** com empacotamento unificado em produção:

```text
Funcionalidade 1 (Link 1: nexora-host-fernando)
 ├── Host Shell (/host) ────────┐
 │   └── Barra de Abas          │──> Servidos juntos no mesmo domínio
 └── Remote MFE (/remote) ──────┘    (/ e /remote/remoteEntry.js)

Funcionalidade 2 (Link 2: nexora-host-dashboard-fernando)
 ├── Host Shell (/host-dashboard) ────────┐
 │   └── Barra de Abas                   │──> Servidos juntos no mesmo domínio
 └── Remote MFE (/remote-dashboard) ─────┘    (/ e /remote-dashboard/remoteEntry.js)
```

1. **Compartilhamento de Dependências (Singletons)**:
   - `react` e `react-dom` são configurados como singletons em todos os módulos, eliminando redundância de bibliotecas em runtime.
2. **Resiliência e Carregamento Sob Demanda**:
   - Componentes remotos são carregados com `React.lazy()` e encapsulados em `Suspense` (com fallback visual) e `ErrorBoundary` para tolerância a falhas.
3. **CORS e Acesso Cross-Origin**:
   - Os servidores estáticos nativos em Node.js (`server.js`) configuram cabeçalhos `Access-Control-Allow-Origin: *` garantindo interoperabilidade total.

---

## 📁 Estrutura de Diretórios do Repositório

```text
NEXORA(Arquitetura Claud)/
├── host/                     # Host Shell - Funcionalidade 1 (Porta 3000)
├── remote/                   # Remote MFE - Funcionalidade 1 (Porta 3001)
├── host-dashboard/           # Host Shell - Funcionalidade 2 (Porta 3004)
├── remote-dashboard/         # Remote MFE - Funcionalidade 2 (Porta 3002)
├── .github/
│   └── workflows/
│       ├── main_nexora-host-fernando.yml            # CI/CD Funcionalidade 1
│       └── main_nexora-host-dashboard-fernando.yml  # CI/CD Funcionalidade 2
├── GRUPO.md
├── README.md
├── .gitignore
└── package.json
```

---

## 🚀 Como Executar Localmente

### 1. Funcionalidade 1 (Gestão de OS)
```bash
# Terminal 1 - Remote 1 (Porta 3001)
cd remote
npm install
npm run dev

# Terminal 2 - Host 1 (Porta 3000)
cd host
npm install
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) para testar o Host Shell e use as abas para alternar para a visão remota.

### 2. Funcionalidade 2 (Dashboard & Analytics)
```bash
# Terminal 1 - Remote Dashboard (Porta 3002)
cd remote-dashboard
npm install
npm run dev

# Terminal 2 - Host Dashboard (Porta 3004)
cd host-dashboard
npm install
npm run dev
```
Acesse [http://localhost:3004](http://localhost:3004) para testar o Host Dashboard e use as abas para alternar para a visão remota.

---

## ☁️ Deploy Contínuo no Azure App Service

O deploy é automatizado via **GitHub Actions** em duas esteiras independentes:
1. `main_nexora-host-fernando.yml` compila o `remote`, unifica seus arquivos de distribuição dentro do pacote do `host` e implanta no Web App **nexora-host-fernando**.
2. `main_nexora-host-dashboard-fernando.yml` compila o `remote-dashboard`, unifica seus arquivos dentro do pacote do `host-dashboard` e implanta no Web App **nexora-host-dashboard-fernando**.
