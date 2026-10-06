# NEXORA - Field Service ERP (Micro-Frontends)

**Atividade Formativa 13 - Arquitetura em Nuvem & Micro-Frontends**

Este repositório contém a implementação da arquitetura de Micro-Frontends (MFE) para o sistema **NEXORA**, um ERP modular voltado para Gestão de Serviços de Campo (*Field Service Management*). A solução utiliza **React 18** e **Webpack 5 Module Federation**, configurada e pronta para implantação em duas instâncias independentes no **Azure Static Web Apps**.

---

## 👥 Integrantes do Grupo

- **Éden Samuel**
- **Fernando Lopes**
- **Felipe Carneiro**
- **Henrique Ricardo**
- **Hugo Takeda**

---

## 🏗️ Arquitetura de Micro-Frontends (MFE)

A aplicação é subdividida em dois projetos independentes que compartilham dependências base (`react` e `react-dom` como singletons):

1. **Remote (`/remote`) — Micro-frontend de Ordens de Serviço**:
   - Roda por padrão na **porta 3001**.
   - Expõe o componente `./OrderForm` através do plugin **Module Federation** do Webpack 5.
   - Possui cabeçalhos de CORS habilitados (`Access-Control-Allow-Origin: *`) para consumo cross-origin em desenvolvimento e produção.
   - Contém formulário completo de Abertura de Ordem de Serviço com validação visual de campos (Cliente, Serviço Solicitado, Técnico Responsável, Prioridade, Status e Valor Estimado R$).

2. **Host (`/host`) — Container Principal / Shell Application**:
   - Roda por padrão na **porta 3000**.
   - Atua como a casca (Shell) principal do NEXORA ERP, com suporte ao Design System e marca oficial.
   - Consome dinamicamente o MFE Remote (`remote/OrderForm`) utilizando `React.lazy` e `React.Suspense` com fallback visual e resiliência via `ErrorBoundary`.
   - Mantém o painel de listagem e controle em tempo real de Ordens de Serviço (com badges coloridos de status/prioridade, ações de alteração de situação e exclusão).

---

## 🎨 Design System NEXORA

- **Navy Principal**: `#06265F` (Usado em barras de navegação, cabeçalhos de cartões e elementos estruturais).
- **Azul Ação**: `#0B5FD7` (Usado em botões primários, destaques e links ativos).
- **Fundo**: `#F8FAFC` (Fundo suave para contraste e legibilidade).
- **Tipografia**: `Inter` / `sans-serif`.
- **Bordas**: Raios arredondados de `8px` a `12px`.

---

## 📁 Estrutura do Repositório

```text
NEXORA(Arquitetura Claud)/
├── host/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── bootstrap.jsx
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── webpack.config.js
├── remote/
│   ├── src/
│   │   ├── components/
│   │   │   └── OrderForm.jsx
│   │   ├── App.jsx
│   │   ├── bootstrap.jsx
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── webpack.config.js
├── .github/
│   └── workflows/
│       ├── azure-static-web-apps-host.yml
│       └── azure-static-web-apps-remote.yml
├── GRUPO.md
├── README.md
├── .gitignore
└── package.json
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js (versão LTS v18 ou superior)
- npm ou yarn

### 2. Instalação das Dependências
Na raiz do projeto, execute o script para instalar as dependências da raiz, do Host e do Remote:

```bash
npm run install:all
```

*(Ou instale manualmente em cada pasta: `npm install`, `cd remote && npm install`, `cd ../host && npm install`)*

### 3. Execução Simultânea (Host + Remote)
Para iniciar ambos os micro-frontends simultaneamente em modo de desenvolvimento:

```bash
npm run dev
```

- **Host (Shell)**: [http://localhost:3000](http://localhost:3000)
- **Remote (OrderForm MFE)**: [http://localhost:3001](http://localhost:3001)

---

## ☁️ Deploy no Azure Static Web Apps

O projeto está preparado para deploy automatizado através do GitHub Actions em duas instâncias separadas do **Azure Static Web Apps**:

1. **Instância do Remote**:
   - `app_location`: `/remote`
   - `output_location`: `dist`
   - Secret necessária no GitHub: `AZURE_STATIC_WEB_APPS_API_TOKEN_REMOTE`

2. **Instância do Host**:
   - `app_location`: `/host`
   - `output_location`: `dist`
   - Secret necessária no GitHub: `AZURE_STATIC_WEB_APPS_API_TOKEN_HOST`
   - Variável de Ambiente / Build: `REMOTE_URL` (apontando para a URL pública do `remoteEntry.js` no Azure, ex: `https://<seu-remote>.azurestaticapps.net/remoteEntry.js`).

### 🌐 URLs Públicas (Azure)

- **Host Application URL**: [https://nexora-host-fernando.azurewebsites.net](https://nexora-host-fernando.azurewebsites.net)
- **Remote Application URL**: [https://nexora-remote-fernando.azurewebsites.net](https://nexora-remote-fernando.azurewebsites.net)

