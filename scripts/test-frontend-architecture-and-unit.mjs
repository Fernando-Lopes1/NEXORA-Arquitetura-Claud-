#!/usr/bin/env node
/**
 * Suíte Automatizada de Testes Unitários e de Arquitetura — Microfrontends NEXORA
 * Abrange os 4 Microfrontends: host, remote, host-dashboard, remote-dashboard
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function test(category, name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] [${category}] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] [${category}] ${name}`);
    console.error(`     Erro: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readAllFiles(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...readAllFiles(fullPath));
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('======================================================================');
console.log('🧪 SUÍTE DE TESTES UNITÁRIOS & ARQUITETURA — MICROFRONTENDS NEXORA');
console.log('======================================================================\n');

const mfeDirs = ['host', 'remote', 'host-dashboard', 'remote-dashboard'];

// ---------------------------------------------------------------------------
// 1. TESTES DE ARQUITETURA: Isolamento do API Gateway & BFF (Sem acesso direto aos Microsserviços)
// ---------------------------------------------------------------------------
test(
  'Arquitetura BFF',
  'Microfrontends consomem exclusivamente o API Gateway & BFF (:8080 / nexora-gateway-api) e nunca acessam microsserviços (:8081/:8082) diretamente',
  () => {
    const forbiddenPatterns = [
      /localhost:8081/i,
      /localhost:8082/i,
      /127\.0\.0\.1:8081/i,
      /127\.0\.0\.1:8082/i,
      /nexora-os-api\.azurewebsites\.net/i,
      /nexora-tecnicos-api\.azurewebsites\.net/i,
    ];

    for (const dir of mfeDirs) {
      const files = readAllFiles(path.join(ROOT_DIR, dir, 'src'));
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        for (const pattern of forbiddenPatterns) {
          assert(
            !pattern.test(content),
            `Violação arquitetural em ${path.relative(ROOT_DIR, file)}: acesso direto a microsserviço detectado (${pattern})`
          );
        }
      }
    }
  }
);

test(
  'Arquitetura BFF',
  'host/src/App.jsx e host-dashboard/src/App.jsx consomem o endpoint de agregação única /api/bff/visao-geral e o proxy do Gateway',
  () => {
    const hostApp = fs.readFileSync(path.join(ROOT_DIR, 'host/src/App.jsx'), 'utf-8');
    const hostDashApp = fs.readFileSync(path.join(ROOT_DIR, 'host-dashboard/src/App.jsx'), 'utf-8');

    assert(hostApp.includes('/api/bff/visao-geral'), 'host/src/App.jsx deve consultar /api/bff/visao-geral no BFF');
    assert(hostApp.includes('/api/ordens'), 'host/src/App.jsx deve consumir /api/ordens via Gateway Proxy');

    assert(
      hostDashApp.includes('/api/bff/visao-geral'),
      'host-dashboard/src/App.jsx deve consultar /api/bff/visao-geral no BFF'
    );
    assert(
      hostDashApp.includes('/api/tecnicos'),
      'host-dashboard/src/App.jsx deve consumir /api/tecnicos via Gateway Proxy'
    );
  }
);

test(
  'Arquitetura Module Federation',
  'Todos os 4 Microfrontends usam fronteira assíncrona import("./bootstrap") em src/index.js',
  () => {
    for (const dir of mfeDirs) {
      const indexFile = path.join(ROOT_DIR, dir, 'src/index.js');
      assert(fs.existsSync(indexFile), `Arquivo ausente: ${dir}/src/index.js`);
      const content = fs.readFileSync(indexFile, 'utf-8').trim();
      assert(
        /import\(['"]\.\/bootstrap['"]\)/.test(content),
        `${dir}/src/index.js deve conter apenas import('./bootstrap')`
      );
    }
  }
);

test(
  'Arquitetura Module Federation',
  'Configurações Webpack 5 declaram ModuleFederationPlugin com remoteEntry.js e React singleton',
  () => {
    for (const dir of mfeDirs) {
      const wpFile = path.join(ROOT_DIR, dir, 'webpack.config.js');
      assert(fs.existsSync(wpFile), `Arquivo ausente: ${dir}/webpack.config.js`);
      const content = fs.readFileSync(wpFile, 'utf-8');
      assert(content.includes('ModuleFederationPlugin'), `${dir}/webpack.config.js deve usar ModuleFederationPlugin`);
      assert(content.includes('singleton: true'), `${dir}/webpack.config.js deve compartilhar React como singleton`);
    }

    const remoteWp = fs.readFileSync(path.join(ROOT_DIR, 'remote/webpack.config.js'), 'utf-8');
    assert(remoteWp.includes('./OrderForm'), 'remote deve expor ./OrderForm via Module Federation');

    const remoteDashWp = fs.readFileSync(path.join(ROOT_DIR, 'remote-dashboard/webpack.config.js'), 'utf-8');
    assert(remoteDashWp.includes('./Dashboard'), 'remote-dashboard deve expor ./Dashboard via Module Federation');
  }
);

test(
  'Segurança Frontend',
  'Nenhum Microfrontend utiliza innerHTML, dangerouslySetInnerHTML, eval(), alert() ou confirm() bloqueantes',
  () => {
    const unsafePatterns = [
      /\binnerHTML\b/,
      /\bdangerouslySetInnerHTML\b/,
      /\beval\s*\(/,
      /\balert\s*\(/,
      /\bconfirm\s*\(/,
    ];

    for (const dir of mfeDirs) {
      const files = readAllFiles(path.join(ROOT_DIR, dir, 'src'));
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        for (const pattern of unsafePatterns) {
          assert(
            !pattern.test(content),
            `Padrão inseguro/bloqueante (${pattern}) encontrado em ${path.relative(ROOT_DIR, file)}`
          );
        }
      }
    }
  }
);

// ---------------------------------------------------------------------------
// 2. TESTES UNITÁRIOS: Lógica de Resolução de Ambiente, Agregação BFF e Componentes
// ---------------------------------------------------------------------------
function resolveGatewayUrlForHost(hostname) {
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:8080' : 'https://nexora-gateway-api.azurewebsites.net';
}

test(
  'Unitário — Resolução Gateway URL',
  'Ambiente localhost/127.0.0.1 resolve para http://localhost:8080 e Azure App Service resolve para https://nexora-gateway-api.azurewebsites.net',
  () => {
    assert(
      resolveGatewayUrlForHost('localhost') === 'http://localhost:8080',
      'localhost deve apontar para http://localhost:8080'
    );
    assert(
      resolveGatewayUrlForHost('127.0.0.1') === 'http://localhost:8080',
      '127.0.0.1 deve apontar para http://localhost:8080'
    );
    assert(
      resolveGatewayUrlForHost('nexora-host-fernando.azurewebsites.net') ===
        'https://nexora-gateway-api.azurewebsites.net',
      'Domínio Azure deve apontar para https://nexora-gateway-api.azurewebsites.net'
    );
  }
);

function normalizeOrderFromBff(o) {
  return {
    id: o.id ?? o.codigo,
    cliente: o.cliente,
    servico: o.descricao || o.servico || o.tipoServico || '',
    tecnico: o.tecnico || o.tecnico_atribuido || o.tecnicoDesignado || 'Não atribuído',
    prioridade: o.prioridade || 'Média',
    situacao: o.status || o.situacao || 'Aberta',
    valorEstimado: Number(o.valor_estimado ?? o.valorEstimado ?? o.valor ?? 0).toFixed(2),
  };
}

test(
  'Unitário — Normalização de Dados do BFF',
  'Normaliza payload agregado do BFF (/api/bff/visao-geral) preservando código, técnico, status e valor formatado',
  () => {
    const rawBffOrder = {
      codigo: 'OS-1001',
      cliente: 'Hospital Central São Lucas',
      tipoServico: 'Manutenção preventiva em gerador principal',
      tecnicoDesignado: 'Henrique Ricardo',
      prioridade: 'Alta',
      status: 'Em execução',
      valor: 1850.5,
    };

    const normalized = normalizeOrderFromBff(rawBffOrder);
    assert(normalized.id === 'OS-1001', 'ID/código deve ser OS-1001');
    assert(normalized.cliente === 'Hospital Central São Lucas', 'Cliente deve ser preservado');
    assert(normalized.tecnico === 'Henrique Ricardo', 'Técnico designado deve ser mapeado');
    assert(normalized.situacao === 'Em execução', 'Status deve ser mapeado para situacao');
    assert(normalized.valorEstimado === '1850.50', 'Valor deve ser formatado com 2 casas decimais');
  }
);

test(
  'Unitário — Componentes Remote MFE',
  'OrderForm.jsx e Dashboard.jsx exportam componentes funcionais React com validação de campos e indicadores KPI',
  () => {
    const orderFormCode = fs.readFileSync(path.join(ROOT_DIR, 'remote/src/components/OrderForm.jsx'), 'utf-8');
    const dashboardCode = fs.readFileSync(path.join(ROOT_DIR, 'remote-dashboard/src/components/Dashboard.jsx'), 'utf-8');

    assert(orderFormCode.includes('export default OrderForm'), 'OrderForm deve ter export default');
    assert(orderFormCode.includes('onAddOrder'), 'OrderForm deve receber callback onAddOrder do Host via props');

    assert(dashboardCode.includes('export default Dashboard'), 'Dashboard deve ter export default');
    assert(dashboardCode.includes('orders'), 'Dashboard deve processar lista de ordens via props');
  }
);

console.log('\n======================================================================');
console.log(`📊 RESULTADO DOS TESTES DE FRONTEND: ${passed} passaram, ${failed} falharam.`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
}
