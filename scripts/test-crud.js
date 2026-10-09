#!/usr/bin/env node
/**
 * NEXORA Field Service - Automated CRUD Test Runner
 * Validates all CRUD endpoints, HTTP status codes (200, 201, 400, 404),
 * Health Checks, and Swagger documentation for both microservices:
 *  - os-service (Port 8081)
 *  - tecnicos-service (Port 8082)
 *
 * Can run against already running services or automatically launch them locally.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

const OS_BASE_URL = process.env.OS_SERVICE_URL || 'http://localhost:8081';
const TECNICOS_BASE_URL = process.env.TECNICOS_SERVICE_URL || 'http://localhost:8082';

const spawnedProcesses = [];

// ANSI colors for clean terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

const statusCodesSeen = {
  200: 0,
  201: 0,
  400: 0,
  404: 0
};

let totalPassed = 0;
let totalFailed = 0;
const failures = [];

async function checkHealth(url) {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.status === 200) {
      const data = await res.json();
      return data && data.status === 'UP';
    }
    return false;
  } catch {
    return false;
  }
}

async function waitForService(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkHealth(url)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function startServiceProcess(serviceDir, serviceName, port) {
  const rootDir = path.resolve(__dirname, '..');
  const targetDir = path.join(rootDir, serviceDir);
  const entryPoint = path.join(targetDir, 'dist', 'index.js');
  
  console.log(`${colors.gray}  Iniciando ${serviceName} na porta ${port}...${colors.reset}`);
  
  const child = spawn(process.execPath, [entryPoint], {
    cwd: targetDir,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.on('error', (err) => {
    console.error(`${colors.red}  Falha ao iniciar processo de ${serviceName}: ${err.message}${colors.reset}`);
  });

  spawnedProcesses.push({ child, name: serviceName });
  return child;
}

function cleanupProcesses() {
  for (const { child, name } of spawnedProcesses) {
    try {
      if (process.platform === 'win32' && child.pid) {
        execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
      } else if (child.pid) {
        child.kill('SIGTERM');
      }
      console.log(`${colors.gray}  Processo ${name} (PID ${child.pid}) encerrado.${colors.reset}`);
    } catch {
      // Processo já encerrado
    }
  }
  spawnedProcesses.length = 0;
}

process.on('exit', cleanupProcesses);
process.on('SIGINT', () => { cleanupProcesses(); process.exit(1); });
process.on('SIGTERM', () => { cleanupProcesses(); process.exit(1); });

async function runTest(testName, fn) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    console.log(`  ${colors.green}✓ [PASS]${colors.reset} ${testName} ${colors.gray}(${duration}ms)${colors.reset}`);
    totalPassed++;
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`  ${colors.red}✗ [FAIL]${colors.reset} ${testName} ${colors.gray}(${duration}ms)${colors.reset}`);
    console.log(`     ${colors.red}Erro: ${error.message}${colors.reset}`);
    totalFailed++;
    failures.push({ name: testName, error: error.message });
  }
}

function recordStatus(status) {
  if (statusCodesSeen[status] !== undefined) {
    statusCodesSeen[status]++;
  }
}

function assertStatus(res, expectedStatus, label = '') {
  recordStatus(res.status);
  if (res.status !== expectedStatus) {
    throw new Error(`${label ? `[${label}] ` : ''}Status HTTP incorreto: esperado ${expectedStatus}, recebido ${res.status}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// --------------------------------------------------------------------------
// SUÍTE DE TESTES: os-service (Porta 8081)
// --------------------------------------------------------------------------
async function runOsServiceTests() {
  console.log(`\n${colors.cyan}${colors.bold}==============================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}🧪 1. SUÍTE DE TESTES CRUD: os-service (${OS_BASE_URL})${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}==============================================================${colors.reset}\n`);

  // 1. Health check & Swagger
  await runTest('GET /health retorna 200 OK com status UP e database connected', async () => {
    const res = await fetch(`${OS_BASE_URL}/health`);
    assertStatus(res, 200, 'Health check');
    const data = await res.json();
    assert(data.status === 'UP', `Status deve ser UP, recebido: ${data.status}`);
    assert(data.service === 'os-service', `Service deve ser os-service, recebido: ${data.service}`);
    assert(data.database === 'connected', `Database deve ser connected, recebido: ${data.database}`);
  });

  await runTest('GET /api-docs.json retorna especificação OpenAPI 3.0 (HTTP 200)', async () => {
    const res = await fetch(`${OS_BASE_URL}/api-docs.json`);
    assertStatus(res, 200, 'Swagger Spec');
    const data = await res.json();
    assert(data.openapi && data.openapi.startsWith('3.'), 'Deve conter versão openapi 3.x');
    assert(data.paths && data.paths['/api/ordens'], 'Deve documentar /api/ordens');
  });

  await runTest('GET /api-docs responde com Swagger UI (HTTP 200 ou 301/302)', async () => {
    const res = await fetch(`${OS_BASE_URL}/api-docs/`, { redirect: 'follow' });
    assert(res.status === 200 || res.status === 301 || res.status === 302, `Status esperado 200/30x, recebido ${res.status}`);
  });

  // 2. Listagem (GET)
  await runTest('GET /api/ordens retorna lista de ordens (HTTP 200)', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens`);
    assertStatus(res, 200, 'Listar ordens');
    const data = await res.json();
    assert(Array.isArray(data), 'Resposta deve ser um array');
    assert(data.length >= 1, `Deve conter ao menos 1 ordem cadastrada, encontrado: ${data.length}`);
  });

  await runTest('GET /api/ordens?status=Aberta filtra ordens pelo status (HTTP 200)', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens?status=Aberta`);
    assertStatus(res, 200, 'Filtro status');
    const data = await res.json();
    assert(Array.isArray(data), 'Resposta deve ser um array');
    for (const item of data) {
      assert(item.status === 'Aberta', `Ordem ${item.id} possui status diferente de Aberta: ${item.status}`);
    }
  });

  await runTest('GET /api/ordens?cliente=NaoExistente_XYZ_9999 retorna array vazio (HTTP 200)', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens?cliente=NaoExistente_XYZ_9999`);
    assertStatus(res, 200, 'Filtro cliente inexistente');
    const data = await res.json();
    assert(Array.isArray(data) && data.length === 0, 'Esperado array vazio');
  });

  // 3. Criação (POST)
  let createdOsId = null;

  await runTest('POST /api/ordens cria nova OS válida e retorna HTTP 201 Created', async () => {
    const payload = {
      cliente: 'Empresa Teste Automação M3',
      descricao: 'Instalação e configuração de chiller industrial',
      prioridade: 'Alta',
      status: 'Aberta',
      valor_estimado: 3500.00,
      prazo: '2026-12-15'
    };
    const res = await fetch(`${OS_BASE_URL}/api/ordens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assertStatus(res, 201, 'Criar ordem válida');
    const data = await res.json();
    assert(data.id, 'Resposta deve conter id gerado');
    assert(data.cliente === payload.cliente, 'Cliente deve coincidir');
    assert(data.status === 'Aberta', 'Status inicial deve ser Aberta');
    createdOsId = data.id;
  });

  await runTest('POST /api/ordens sem cliente retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: 'Sem cliente' })
    });
    assertStatus(res, 400, 'Criar ordem sem cliente');
  });

  await runTest('POST /api/ordens com prioridade inválida retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: 'Cliente Teste',
        descricao: 'Descricao',
        prioridade: 'PrioridadeInvalida'
      })
    });
    assertStatus(res, 400, 'Criar ordem prioridade inválida');
  });

  await runTest('POST /api/ordens com valor_estimado negativo retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: 'Cliente Teste',
        descricao: 'Descricao',
        valor_estimado: -500
      })
    });
    assertStatus(res, 400, 'Criar ordem valor negativo');
  });

  // 4. Detalhamento (GET /:id)
  await runTest('GET /api/ordens/:id retorna detalhes da OS criada (HTTP 200)', async () => {
    assert(createdOsId, 'ID da OS criada não definido');
    const res = await fetch(`${OS_BASE_URL}/api/ordens/${createdOsId}`);
    assertStatus(res, 200, 'Detalhar ordem');
    const data = await res.json();
    assert(data.id === createdOsId, 'ID deve coincidir');
    assert(data.cliente === 'Empresa Teste Automação M3', 'Cliente deve coincidir');
  });

  await runTest('GET /api/ordens/:id inexistente retorna HTTP 404 Not Found', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens/999999`);
    assertStatus(res, 404, 'Detalhar ordem inexistente');
  });

  await runTest('GET /api/ordens/:id inválido (não numérico) retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens/invalido_id`);
    assertStatus(res, 400, 'Detalhar ordem com ID inválido');
  });

  // 5. Atualização Cadastral (PUT /:id)
  await runTest('PUT /api/ordens/:id atualiza campos cadastrais da OS (HTTP 200)', async () => {
    assert(createdOsId, 'ID da OS criada não definido');
    const updatePayload = {
      descricao: 'Instalação revisada de chiller com laudo técnico',
      valor_estimado: 4200.00
    };
    const res = await fetch(`${OS_BASE_URL}/api/ordens/${createdOsId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    assertStatus(res, 200, 'Atualizar ordem');
    const data = await res.json();
    assert(data.descricao === updatePayload.descricao, 'Descrição atualizada');
    assert(data.valor_estimado === 4200.00, 'Valor estimado atualizado');
  });

  await runTest('PUT /api/ordens/:id inexistente retorna HTTP 404 Not Found', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens/999999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: 'Teste' })
    });
    assertStatus(res, 404, 'Atualizar ordem inexistente');
  });

  await runTest('PUT /api/ordens/:id com valor_estimado negativo retorna HTTP 400 Bad Request', async () => {
    assert(createdOsId, 'ID da OS criada não definido');
    const res = await fetch(`${OS_BASE_URL}/api/ordens/${createdOsId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor_estimado: -100 })
    });
    assertStatus(res, 400, 'Atualizar ordem valor negativo');
  });

  // 6. Atualização de Ciclo de Vida (PATCH /:id/status)
  await runTest('PATCH /api/ordens/:id/status para Agendada fornecendo técnico retorna HTTP 200', async () => {
    assert(createdOsId, 'ID da OS criada não definido');
    const res = await fetch(`${OS_BASE_URL}/api/ordens/${createdOsId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Agendada', tecnico: 'Fernando Lopes' })
    });
    assertStatus(res, 200, 'Atualizar status para Agendada');
    const data = await res.json();
    assert(data.status === 'Agendada', 'Status deve ser Agendada');
    assert(data.tecnico === 'Fernando Lopes', 'Técnico deve estar atribuído');
  });

  await runTest('PATCH /api/ordens/:id/status violando ciclo de vida retorna HTTP 400 Bad Request', async () => {
    assert(createdOsId, 'ID da OS criada não definido');
    // De Agendada não pode ir direto para Concluída sem passar por Em Execução
    const res = await fetch(`${OS_BASE_URL}/api/ordens/${createdOsId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Concluída' })
    });
    assertStatus(res, 400, 'Pular etapa de ciclo de vida');
  });

  await runTest('PATCH /api/ordens/:id/status com ID inexistente retorna HTTP 404 Not Found', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens/999999/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Aberta' })
    });
    assertStatus(res, 404, 'Atualizar status ID inexistente');
  });

  // 7. Remoção (DELETE /:id)
  await runTest('DELETE /api/ordens/:id remove a OS com sucesso (HTTP 200)', async () => {
    assert(createdOsId, 'ID da OS criada não definido');
    const res = await fetch(`${OS_BASE_URL}/api/ordens/${createdOsId}`, {
      method: 'DELETE'
    });
    assertStatus(res, 200, 'Deletar ordem');
    const data = await res.json();
    assert(data.message && data.message.includes('sucesso'), 'Mensagem de confirmação deve existir');
  });

  await runTest('GET /api/ordens/:id após exclusão confirma remoção (HTTP 404 Not Found)', async () => {
    assert(createdOsId, 'ID da OS criada não definido');
    const res = await fetch(`${OS_BASE_URL}/api/ordens/${createdOsId}`);
    assertStatus(res, 404, 'Buscar ordem já deletada');
  });

  await runTest('DELETE /api/ordens/:id repetido retorna HTTP 404 Not Found', async () => {
    assert(createdOsId, 'ID da OS criada não definido');
    const res = await fetch(`${OS_BASE_URL}/api/ordens/${createdOsId}`, {
      method: 'DELETE'
    });
    assertStatus(res, 404, 'Deletar novamente ordem inexistente');
  });

  await runTest('DELETE /api/ordens/:id com ID inválido retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${OS_BASE_URL}/api/ordens/invalido_id`, {
      method: 'DELETE'
    });
    assertStatus(res, 400, 'Deletar ordem ID não numérico');
  });
}

// --------------------------------------------------------------------------
// SUÍTE DE TESTES: tecnicos-service (Porta 8082)
// --------------------------------------------------------------------------
async function runTecnicosServiceTests() {
  console.log(`\n${colors.yellow}${colors.bold}==============================================================${colors.reset}`);
  console.log(`${colors.yellow}${colors.bold}🧪 2. SUÍTE DE TESTES CRUD: tecnicos-service (${TECNICOS_BASE_URL})${colors.reset}`);
  console.log(`${colors.yellow}${colors.bold}==============================================================${colors.reset}\n`);

  // 1. Health check & Swagger
  await runTest('GET /health retorna 200 OK com status UP e database connected', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/health`);
    assertStatus(res, 200, 'Health check');
    const data = await res.json();
    assert(data.status === 'UP', `Status deve ser UP, recebido: ${data.status}`);
    assert(data.service === 'tecnicos-service', `Service deve ser tecnicos-service, recebido: ${data.service}`);
    assert(data.database === 'connected', `Database deve ser connected, recebido: ${data.database}`);
  });

  await runTest('GET /api-docs.json retorna especificação OpenAPI 3.0 (HTTP 200)', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api-docs.json`);
    assertStatus(res, 200, 'Swagger Spec');
    const data = await res.json();
    assert(data.openapi && data.openapi.startsWith('3.'), 'Deve conter versão openapi 3.x');
    assert(data.paths && data.paths['/api/tecnicos'], 'Deve documentar /api/tecnicos');
  });

  await runTest('GET /api-docs responde com Swagger UI (HTTP 200 ou 301/302)', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api-docs/`, { redirect: 'follow' });
    assert(res.status === 200 || res.status === 301 || res.status === 302, `Status esperado 200/30x, recebido ${res.status}`);
  });

  // 2. Listagem (GET)
  await runTest('GET /api/tecnicos retorna lista de técnicos (HTTP 200)', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos`);
    assertStatus(res, 200, 'Listar técnicos');
    const data = await res.json();
    assert(Array.isArray(data), 'Resposta deve ser um array');
    assert(data.length >= 1, `Deve conter ao menos 1 técnico, encontrado: ${data.length}`);
  });

  await runTest('GET /api/tecnicos?especialidade=Climatização filtra técnicos por especialidade (HTTP 200)', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos?especialidade=Climatização`);
    assertStatus(res, 200, 'Filtro especialidade');
    const data = await res.json();
    assert(Array.isArray(data), 'Resposta deve ser um array');
    for (const item of data) {
      assert(item.especialidade === 'Climatização', `Técnico ${item.nome} tem especialidade diferente: ${item.especialidade}`);
    }
  });

  await runTest('GET /api/tecnicos?regiao=NaoExistente_XYZ_9999 retorna array vazio (HTTP 200)', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos?regiao=NaoExistente_XYZ_9999`);
    assertStatus(res, 200, 'Filtro região inexistente');
    const data = await res.json();
    assert(Array.isArray(data) && data.length === 0, 'Esperado array vazio');
  });

  // 3. Criação (POST)
  let createdTecnicoId = null;

  await runTest('POST /api/tecnicos cria novo técnico válido e retorna HTTP 201 Created', async () => {
    const payload = {
      nome: 'Ricardo Montalvão Teste M3',
      especialidade: 'Refrigeração',
      telefone: '(11) 98765-4321',
      email: 'ricardo.teste@nexora.com.br',
      regiao: 'Grande São Paulo - Zona Leste',
      status: 'Disponível'
    };
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assertStatus(res, 201, 'Criar técnico');
    const data = await res.json();
    assert(data.id, 'Resposta deve conter ID gerado');
    assert(data.nome === payload.nome, 'Nome deve coincidir');
    assert(data.especialidade === payload.especialidade, 'Especialidade deve coincidir');
    assert(data.status === 'Disponível', 'Status deve ser Disponível');
    createdTecnicoId = data.id;
  });

  await runTest('POST /api/tecnicos sem nome retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ especialidade: 'Climatização' })
    });
    assertStatus(res, 400, 'Criar técnico sem nome');
  });

  await runTest('POST /api/tecnicos com especialidade inválida retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Nome Teste', especialidade: 'EspecialidadeInexistente' })
    });
    assertStatus(res, 400, 'Criar técnico especialidade inválida');
  });

  await runTest('POST /api/tecnicos com email mal formatado retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Nome Teste', especialidade: 'Mecânica', email: 'email_sem_arroba' })
    });
    assertStatus(res, 400, 'Criar técnico email inválido');
  });

  // 4. Detalhamento (GET /:id)
  await runTest('GET /api/tecnicos/:id retorna detalhes do técnico criado (HTTP 200)', async () => {
    assert(createdTecnicoId, 'ID do técnico não definido');
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/${createdTecnicoId}`);
    assertStatus(res, 200, 'Detalhar técnico');
    const data = await res.json();
    assert(data.id === createdTecnicoId, 'ID deve coincidir');
    assert(data.nome === 'Ricardo Montalvão Teste M3', 'Nome deve coincidir');
  });

  await runTest('GET /api/tecnicos/:id inexistente retorna HTTP 404 Not Found', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/999999`);
    assertStatus(res, 404, 'Detalhar técnico inexistente');
  });

  await runTest('GET /api/tecnicos/:id inválido (não numérico) retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/nao-e-numero`);
    assertStatus(res, 400, 'Detalhar técnico com ID não numérico');
  });

  // 5. Atualização Cadastral (PUT /:id)
  await runTest('PUT /api/tecnicos/:id atualiza dados cadastrais do técnico (HTTP 200)', async () => {
    assert(createdTecnicoId, 'ID do técnico não definido');
    const updatePayload = {
      nome: 'Ricardo Montalvão Ramos Atualizado',
      telefone: '(11) 91111-2222',
      regiao: 'São Paulo - Todas as Regiões'
    };
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/${createdTecnicoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    assertStatus(res, 200, 'Atualizar técnico');
    const data = await res.json();
    assert(data.nome === updatePayload.nome, 'Nome atualizado');
    assert(data.regiao === updatePayload.regiao, 'Região atualizada');
  });

  await runTest('PUT /api/tecnicos/:id inexistente retorna HTTP 404 Not Found', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/999999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Inexistente' })
    });
    assertStatus(res, 404, 'Atualizar técnico inexistente');
  });

  await runTest('PUT /api/tecnicos/:id com especialidade inválida retorna HTTP 400 Bad Request', async () => {
    assert(createdTecnicoId, 'ID do técnico não definido');
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/${createdTecnicoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ especialidade: 'EspecialidadeErrada' })
    });
    assertStatus(res, 400, 'Atualizar técnico especialidade inválida');
  });

  // 6. Atualização de Disponibilidade (PATCH /:id/disponibilidade)
  await runTest('PATCH /api/tecnicos/:id/disponibilidade altera status para Em Atendimento (HTTP 200)', async () => {
    assert(createdTecnicoId, 'ID do técnico não definido');
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/${createdTecnicoId}/disponibilidade`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Em Atendimento' })
    });
    assertStatus(res, 200, 'Atualizar status disponibilidade');
    const data = await res.json();
    assert(data.status === 'Em Atendimento', `Status esperado 'Em Atendimento', recebido: ${data.status}`);
  });

  await runTest('PATCH /api/tecnicos/:id/disponibilidade com status inválido retorna HTTP 400 Bad Request', async () => {
    assert(createdTecnicoId, 'ID do técnico não definido');
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/${createdTecnicoId}/disponibilidade`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'StatusDesconhecido' })
    });
    assertStatus(res, 400, 'Atualizar disponibilidade status inválido');
  });

  await runTest('PATCH /api/tecnicos/:id/disponibilidade em técnico inexistente retorna HTTP 404 Not Found', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/999999/disponibilidade`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Ausente' })
    });
    assertStatus(res, 404, 'Atualizar disponibilidade técnico inexistente');
  });

  // 7. Remoção (DELETE /:id)
  await runTest('DELETE /api/tecnicos/:id remove técnico com sucesso (HTTP 200)', async () => {
    assert(createdTecnicoId, 'ID do técnico não definido');
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/${createdTecnicoId}`, {
      method: 'DELETE'
    });
    assertStatus(res, 200, 'Deletar técnico');
    const data = await res.json();
    assert(data.message && data.message.includes('sucesso'), 'Mensagem de sucesso ausente');
  });

  await runTest('GET /api/tecnicos/:id após exclusão confirma remoção (HTTP 404 Not Found)', async () => {
    assert(createdTecnicoId, 'ID do técnico não definido');
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/${createdTecnicoId}`);
    assertStatus(res, 404, 'Buscar técnico já deletado');
  });

  await runTest('DELETE /api/tecnicos/:id repetido retorna HTTP 404 Not Found', async () => {
    assert(createdTecnicoId, 'ID do técnico não definido');
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/${createdTecnicoId}`, {
      method: 'DELETE'
    });
    assertStatus(res, 404, 'Deletar novamente técnico');
  });

  await runTest('DELETE /api/tecnicos/:id com ID inválido retorna HTTP 400 Bad Request', async () => {
    const res = await fetch(`${TECNICOS_BASE_URL}/api/tecnicos/invalido_id`, {
      method: 'DELETE'
    });
    assertStatus(res, 400, 'Deletar técnico ID não numérico');
  });
}

// --------------------------------------------------------------------------
// EXECUÇÃO PRINCIPAL
// --------------------------------------------------------------------------
async function main() {
  const startTime = Date.now();
  console.log(`\n${colors.bold}========================================================================${colors.reset}`);
  console.log(`${colors.bold}🚀 NEXORA FIELD SERVICE ERP - EXECUTOR AUTOMATIZADO DE TESTES CRUD${colors.reset}`);
  console.log(`${colors.bold}========================================================================${colors.reset}\n`);

  console.log(`${colors.gray}🔍 Verificando conectividade com os microsserviços...${colors.reset}`);
  let osReady = await checkHealth(OS_BASE_URL);
  let tecnicosReady = await checkHealth(TECNICOS_BASE_URL);

  if (!osReady) {
    console.log(`${colors.yellow}⚠️  os-service não detectado ativo em ${OS_BASE_URL}. Inicializando localmente...${colors.reset}`);
    startServiceProcess('os-service', 'os-service', 8081);
    osReady = await waitForService(OS_BASE_URL);
    if (!osReady) {
      console.error(`${colors.red}❌ Falha: não foi possível inicializar os-service em tempo hábil.${colors.reset}`);
      process.exit(1);
    }
    console.log(`${colors.green}✅ os-service inicializado e respondendo em ${OS_BASE_URL}!${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ os-service já está em execução em ${OS_BASE_URL}.${colors.reset}`);
  }

  if (!tecnicosReady) {
    console.log(`${colors.yellow}⚠️  tecnicos-service não detectado ativo em ${TECNICOS_BASE_URL}. Inicializando localmente...${colors.reset}`);
    startServiceProcess('tecnicos-service', 'tecnicos-service', 8082);
    tecnicosReady = await waitForService(TECNICOS_BASE_URL);
    if (!tecnicosReady) {
      console.error(`${colors.red}❌ Falha: não foi possível inicializar tecnicos-service em tempo hábil.${colors.reset}`);
      process.exit(1);
    }
    console.log(`${colors.green}✅ tecnicos-service inicializado e respondendo em ${TECNICOS_BASE_URL}!${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ tecnicos-service já está em execução em ${TECNICOS_BASE_URL}.${colors.reset}`);
  }

  // Executa as duas suítes de testes
  try {
    await runOsServiceTests();
    await runTecnicosServiceTests();
  } finally {
    if (spawnedProcesses.length > 0) {
      console.log(`\n${colors.gray}🧹 Finalizando processos de teste inicializados...${colors.reset}`);
      cleanupProcesses();
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // Resumo final
  console.log(`\n${colors.bold}========================================================================${colors.reset}`);
  console.log(`${colors.bold}📊 RELATÓRIO CONSOLIDADO DE EXECUÇÃO${colors.reset}`);
  console.log(`${colors.bold}========================================================================${colors.reset}`);
  console.log(`  Tempo Total:        ${durationSec}s`);
  console.log(`  Testes Aprovados:   ${colors.green}${colors.bold}${totalPassed}${colors.reset}`);
  console.log(`  Testes Falhados:    ${totalFailed > 0 ? colors.red : colors.gray}${colors.bold}${totalFailed}${colors.reset}`);
  console.log(`------------------------------------------------------------------------`);
  console.log(`${colors.bold}📌 Cobertura de Códigos HTTP Validados:${colors.reset}`);
  console.log(`  • HTTP 200 OK:          ${statusCodesSeen[200]} ocorrências validadas`);
  console.log(`  • HTTP 201 Created:     ${statusCodesSeen[201]} ocorrências validadas`);
  console.log(`  • HTTP 400 Bad Request: ${statusCodesSeen[400]} ocorrências validadas`);
  console.log(`  • HTTP 404 Not Found:   ${statusCodesSeen[404]} ocorrências validadas`);
  console.log(`${colors.bold}========================================================================${colors.reset}\n`);

  if (totalFailed > 0) {
    console.error(`${colors.red}${colors.bold}❌ A suíte de testes falhou com ${totalFailed} erro(s).${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✨ Todos os ${totalPassed} testes CRUD foram executados e APROVADOS com sucesso!${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Falha fatal não tratada no runner:${colors.reset}`, err);
  cleanupProcesses();
  process.exit(1);
});
