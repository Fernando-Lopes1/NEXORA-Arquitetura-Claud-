import http from 'http';
import app from '../src/app';
import { getDatabase } from '../src/db/factory';

async function runAdversarialTests() {
  console.log('====================================================');
  console.log('🔥 INICIANDO SUÍTE DE TESTES ADVERSARIAIS - os-service');
  console.log('   Empirical Stress Testing & Boundary Verification');
  console.log('====================================================\n');

  const db = await getDatabase();
  console.log(`📦 Database provider ativo: ${db.getProviderName()}\n`);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  let passed = 0;
  let failed = 0;
  const failureDetails: string[] = [];

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Erro: ${err.message}`);
      failureDetails.push(`${name} -> ${err.message}`);
      failed++;
    }
  }

  try {
    // =============================================================
    // GRUPO 1: CICLO DE VIDA E STATE MACHINE ADVERSARIAL
    // =============================================================
    console.log('\n--- [GRUPO 1] Ciclo de Vida e Violações de State Machine ---');

    // Cria OS base para os testes de transição
    const resBase = await fetch(`${baseUrl}/api/ordens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: 'Cliente Teste Ciclo',
        descricao: 'Teste rigoroso de transições',
        status: 'Aberta'
      })
    });
    if (resBase.status !== 201) throw new Error('Falha ao criar OS base para testes de ciclo');
    const osBase = await resBase.json() as any;
    const baseId = osBase.id;

    await test('1.1 Pulo de etapa: Aberta -> Concluída via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluída', tecnico: 'Carlos' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
      const body = await res.json() as any;
      if (!body.erro) throw new Error('Mensagem de erro ausente na resposta 400');
    });

    await test('1.2 Pulo de etapa: Aberta -> Concluída via PUT deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluída', tecnico: 'Carlos' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.3 Pulo de etapa: Aberta -> Em Execução via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Em Execução', tecnico: 'Carlos' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.4 Aberta -> Agendada sem técnico deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Agendada' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.5 Aberta -> Agendada com técnico em branco ("   ") deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Agendada', tecnico: '   ' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.6 Auto-transição: Aberta -> Aberta via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aberta' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    // Avança para Agendada
    const resAgendada = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Agendada', tecnico: 'Carlos Silva' })
    });
    if (resAgendada.status !== 200) throw new Error('Falha ao avançar OS para Agendada');

    await test('1.7 Retrocesso: Agendada -> Aberta via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aberta' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.8 Pulo de etapa: Agendada -> Concluída via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluída' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    // Avança para Em Execução
    const resExec = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Em Execução' })
    });
    if (resExec.status !== 200) throw new Error('Falha ao avançar OS para Em Execução');

    await test('1.9 Retrocesso: Em Execução -> Agendada via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Agendada' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.10 Retrocesso: Em Execução -> Aberta via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aberta' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    // Avança para Concluída (terminal)
    const resConcl = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Concluída' })
    });
    if (resConcl.status !== 200) throw new Error('Falha ao avançar OS para Concluída');

    await test('1.11 Modificação de estado terminal: Concluída -> Aberta via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aberta' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.12 Modificação de estado terminal: Concluída -> Cancelada via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelada' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.13 Auto-transição em terminal: Concluída -> Concluída via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluída' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.14 Modificação de estado terminal: Concluída -> Aberta via PUT deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${baseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aberta' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    // Cria OS para testar terminal Cancelada
    const resCancBase = await fetch(`${baseUrl}/api/ordens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: 'Cliente Teste Cancelamento',
        descricao: 'Teste de terminal Cancelada',
        status: 'Aberta'
      })
    });
    const osCanc = await resCancBase.json() as any;
    const cancId = osCanc.id;

    await fetch(`${baseUrl}/api/ordens/${cancId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelada' })
    });

    await test('1.15 Modificação de estado terminal: Cancelada -> Aberta via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${cancId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aberta' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.16 Modificação de estado terminal: Cancelada -> Concluída via PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${cancId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluída', tecnico: 'Marcos' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('1.17 Status desconhecido/inválido no PATCH deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${cancId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'StatusTotalmenteInvalido' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    // Limpa OSs de teste de ciclo
    await fetch(`${baseUrl}/api/ordens/${baseId}`, { method: 'DELETE' });
    await fetch(`${baseUrl}/api/ordens/${cancId}`, { method: 'DELETE' });

    // =============================================================
    // GRUPO 2: VALIDAÇÃO DE ENTRADA, FRONTEIRAS E NÚMEROS NEGATIVOS
    // =============================================================
    console.log('\n--- [GRUPO 2] Validação de Entrada, Fronteiras e Números Negativos ---');

    await test('2.1 POST com valor_estimado negativo (-0.01) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente Teste',
          descricao: 'Desc',
          valor_estimado: -0.01
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('2.2 POST com valor_estimado negativo grande (-99999) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente Teste',
          descricao: 'Desc',
          valor_estimado: -99999
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('2.3 POST com valor_estimado = 0 (fronteira exata) deve ser aceito e retornar 201', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente Zero',
          descricao: 'Serviço gratuito/garantia',
          valor_estimado: 0
        })
      });
      if (res.status !== 201) throw new Error(`Esperado 201, recebido ${res.status}`);
      const body = await res.json() as any;
      if (body.valor_estimado !== 0) throw new Error(`Esperado valor 0, recebido ${body.valor_estimado}`);
      // Cleanup
      await fetch(`${baseUrl}/api/ordens/${body.id}`, { method: 'DELETE' });
    });

    await test('2.4 POST com valor_estimado grande positivo (9999999.99) deve ser aceito e retornar 201', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente Grande Obra',
          descricao: 'Substituição completa do sistema HVAC',
          valor_estimado: 9999999.99
        })
      });
      if (res.status !== 201) throw new Error(`Esperado 201, recebido ${res.status}`);
      const body = await res.json() as any;
      if (body.valor_estimado !== 9999999.99) throw new Error(`Esperado 9999999.99, recebido ${body.valor_estimado}`);
      await fetch(`${baseUrl}/api/ordens/${body.id}`, { method: 'DELETE' });
    });

    await test('2.5 POST com cliente vazio ("   ") deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: '   ',
          descricao: 'Descricao valida'
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('2.6 POST com cliente ausente deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: 'Descricao valida'
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('2.7 POST com descricao vazia ("") deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente OK',
          descricao: ''
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('2.8 POST com prioridade inválida ("UrgenteDemais") deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente OK',
          descricao: 'Desc OK',
          prioridade: 'UrgenteDemais'
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('2.9 POST com status inicial "Em Execução" sem técnico deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente OK',
          descricao: 'Desc OK',
          status: 'Em Execução'
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('2.10 POST com status inicial "Concluída" sem técnico deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente OK',
          descricao: 'Desc OK',
          status: 'Concluída'
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    // =============================================================
    // GRUPO 3: PARÂMETROS DE URL E IDS NÃO EXISTENTES/INVÁLIDOS
    // =============================================================
    console.log('\n--- [GRUPO 3] Parâmetros de URL e IDs Inexistentes/Inválidos ---');

    await test('3.1 GET /api/ordens/-5 (ID negativo) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/-5`);
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('3.2 GET /api/ordens/0 (ID zero) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/0`);
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('3.3 GET /api/ordens/3.14 (ID float não inteiro) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/3.14`);
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('3.4 GET /api/ordens/NaN (ID string NaN) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/NaN`);
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('3.5 GET /api/ordens/999999999 (ID inexistente) deve retornar 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/999999999`);
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    await test('3.6 PUT /api/ordens/-1 (ID negativo) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/-1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: 'Nova desc' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('3.7 PUT /api/ordens/999999999 (ID inexistente) deve retornar 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/999999999`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: 'Nova desc' })
      });
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    await test('3.8 PATCH /api/ordens/-1/status (ID negativo) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/-1/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelada' })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('3.9 PATCH /api/ordens/999999999/status (ID inexistente) deve retornar 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/999999999/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelada' })
      });
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    await test('3.10 DELETE /api/ordens/-1 (ID negativo) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/-1`, { method: 'DELETE' });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('3.11 DELETE /api/ordens/999999999 (ID inexistente) deve retornar 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/999999999`, { method: 'DELETE' });
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    // =============================================================
    // GRUPO 4: IDEMPOTÊNCIA DE DELEÇÃO E INTEGRIDADE PÓS-EXCLUSÃO
    // =============================================================
    console.log('\n--- [GRUPO 4] Idempotência de Deleção e Integridade Pós-Exclusão ---');

    const resDelBase = await fetch(`${baseUrl}/api/ordens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: 'Cliente Para Teste Delete',
        descricao: 'Ordem a ser excluída',
        status: 'Aberta'
      })
    });
    const osDel = await resDelBase.json() as any;
    const targetDelId = osDel.id;

    await test('4.1 Primeira exclusão da OS deve retornar 200', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${targetDelId}`, { method: 'DELETE' });
      if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
    });

    await test('4.2 Segunda exclusão no mesmo ID (idempotência controlada) deve retornar 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${targetDelId}`, { method: 'DELETE' });
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    await test('4.3 GET na OS excluída deve retornar 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${targetDelId}`);
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    await test('4.4 PUT na OS excluída deve retornar 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${targetDelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: 'Tentando alterar ordem apagada' })
      });
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    await test('4.5 PATCH na OS excluída deve retornar 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${targetDelId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelada' })
      });
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    // =============================================================
    // GRUPO 5: INJEÇÃO SQL E PARAMETRIZAÇÃO DEFENSIVA
    // =============================================================
    console.log('\n--- [GRUPO 5] Injeção SQL e Parametrização Defensiva ---');

    await test("5.1 Injeção SQL em query parameter cliente (' OR '1'='1) não vaza dados nem quebra", async () => {
      const res = await fetch(`${baseUrl}/api/ordens?cliente=${encodeURIComponent("' OR '1'='1")}`);
      if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
      const data = await res.json() as any[];
      // Deve buscar como literal e retornar array vazio
      if (!Array.isArray(data)) throw new Error('Resultado deve ser um array');
      if (data.length !== 0) throw new Error('Injeção SQL permitiu bypass de filtro!');
    });

    await test("5.2 Injeção SQL destrutiva em query parameter ('; DROP TABLE ordens_servico; --) não executa DDL", async () => {
      const res = await fetch(`${baseUrl}/api/ordens?cliente=${encodeURIComponent("'; DROP TABLE ordens_servico; --")}`);
      if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
      // Verifica se a tabela ainda existe consultando /health e /api/ordens
      const checkRes = await fetch(`${baseUrl}/health`);
      const checkBody = await checkRes.json() as any;
      if (checkBody.database !== 'connected') throw new Error('A tabela foi afetada por injeção SQL!');
    });

    await test("5.3 Injeção SQL no parâmetro de rota ID (/api/ordens/1' OR '1'='1) deve retornar 400 sem crash", async () => {
      const res = await fetch(`${baseUrl}/api/ordens/1'%20OR%20'1'='1`);
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test("5.4 Injeção SQL no corpo POST é tratada com segurança e persistida como texto literal", async () => {
      const maliciousName = "Cliente Robert'); DROP TABLE ordens_servico;--";
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: maliciousName,
          descricao: "Descricao com aspas ' e barras \\ e ponto-e-virgula ;",
          status: 'Aberta'
        })
      });
      if (res.status !== 201) throw new Error(`Esperado 201, recebido ${res.status}`);
      const body = await res.json() as any;
      if (body.cliente !== maliciousName) throw new Error('Literal não foi preservado com segurança');

      // Limpa registro de injeção
      await fetch(`${baseUrl}/api/ordens/${body.id}`, { method: 'DELETE' });

      // Confirma que banco continua íntegro
      const health = await fetch(`${baseUrl}/health`);
      if (health.status !== 200) throw new Error('Banco corrompido pós tentativa de injeção');
    });

    await test("5.5 Injeção SQL no PATCH status é rejeitada com 400", async () => {
      const res = await fetch(`${baseUrl}/api/ordens/1/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "' OR '1'='1" })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    // =============================================================
    // GRUPO 6: PAYLOADS MALFORMADOS E COMPORTAMENTO ROBUSTO (SEM CRASH)
    // =============================================================
    console.log('\n--- [GRUPO 6] Payloads Malformados e Resiliência ---');

    await test('6.1 JSON sintaticamente quebrado no body retorna 400 sem derrubar o processo', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"cliente": "Incompleto sem fechar chaves'
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('6.2 Body vazio {} no POST retorna 400 sem crash', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('6.3 Array no lugar de objeto JSON [1, 2, 3] retorna 400 sem crash', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([1, 2, 3])
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('6.4 Rota inexistente GET /api/desconhecida retorna 404 graceful', async () => {
      const res = await fetch(`${baseUrl}/api/desconhecida`);
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    await test('6.5 Rota inexistente POST /api/ordens/123/subrecurso retorna 404 graceful', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/123/subrecurso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teste: 1 })
      });
      if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
    });

    // =============================================================
    // GRUPO 7: FORMATAÇÃO DE PRAZO E DATAS
    // =============================================================
    console.log('\n--- [GRUPO 7] Formatação de Prazo e Datas ---');

    await test('7.1 POST com prazo ISO 8601 válido é persistido corretamente', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente Data ISO',
          descricao: 'Prazo ISO',
          prazo: '2026-12-31'
        })
      });
      if (res.status !== 201) throw new Error(`Esperado 201, recebido ${res.status}`);
      const body = await res.json() as any;
      if (body.prazo !== '2026-12-31') throw new Error(`Prazo retornado diverge: ${body.prazo}`);
      await fetch(`${baseUrl}/api/ordens/${body.id}`, { method: 'DELETE' });
    });

    await test('7.2 POST com prazo omitido salva como null', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente Sem Prazo',
          descricao: 'Prazo nulo'
        })
      });
      if (res.status !== 201) throw new Error(`Esperado 201, recebido ${res.status}`);
      const body = await res.json() as any;
      if (body.prazo !== null) throw new Error(`Esperado null, recebido ${body.prazo}`);
      await fetch(`${baseUrl}/api/ordens/${body.id}`, { method: 'DELETE' });
    });

    // =============================================================
    // GRUPO 8: CORS, HEADERS E CONTRATO DE INFRAESTRUTURA
    // =============================================================
    console.log('\n--- [GRUPO 8] CORS, Headers e Contrato OpenAPI/Health ---');

    await test('8.1 Requisição OPTIONS (Pre-flight CORS) responde 204 com Access-Control-Allow-Origin *', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://nexora-host-fernando.azurewebsites.net',
          'Access-Control-Request-Method': 'POST'
        }
      });
      const allowOrigin = res.headers.get('access-control-allow-origin');
      if (allowOrigin !== '*') throw new Error(`Esperado Access-Control-Allow-Origin *, recebido ${allowOrigin}`);
    });

    await test('8.2 GET /health retorna 200 com payload UP e banco conectado', async () => {
      const res = await fetch(`${baseUrl}/health`);
      if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
      const body = await res.json() as any;
      if (body.status !== 'UP' || body.database !== 'connected') {
        throw new Error(`Payload health inválido: ${JSON.stringify(body)}`);
      }
    });

    await test('8.3 GET / redireciona para /api-docs', async () => {
      const res = await fetch(`${baseUrl}/`, { redirect: 'manual' });
      if (res.status !== 302 && res.status !== 301) throw new Error(`Esperado redirect 302/301, recebido ${res.status}`);
    });

    await test('8.4 GET /api-docs.json contém OpenAPI 3.0 com todas as 6 operações de ordens', async () => {
      const res = await fetch(`${baseUrl}/api-docs.json`);
      if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
      const spec = await res.json() as any;
      if (!spec.paths['/api/ordens']?.get || !spec.paths['/api/ordens']?.post) {
        throw new Error('Operações de /api/ordens ausentes no Swagger spec');
      }
      if (!spec.paths['/api/ordens/{id}']?.get || !spec.paths['/api/ordens/{id}']?.put || !spec.paths['/api/ordens/{id}']?.delete) {
        throw new Error('Operações de /api/ordens/{id} ausentes no Swagger spec');
      }
      if (!spec.paths['/api/ordens/{id}/status']?.patch) {
        throw new Error('Operação PATCH de status ausente no Swagger spec');
      }
    });

    await test('8.5 Tipo inesperado no cliente (objeto em vez de string) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: { nome: 'Objeto Inesperado' },
          descricao: 'Desc'
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await test('8.6 Tipo inesperado na descricao (número em vez de string) deve retornar 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente Ok',
          descricao: 123456
        })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });


  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try {
      await db.close();
    } catch {
      // Ignora erro de close
    }
  }

  console.log('\n====================================================');
  console.log(`📊 RESULTADO FINAL DO STRESS TEST: ${passed} passaram, ${failed} falharam.`);
  console.log('====================================================\n');

  if (failed > 0) {
    console.error('⚠️ FALHAS DETECTADAS:');
    failureDetails.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
    process.exit(1);
  }
}

runAdversarialTests().catch((err) => {
  console.error('Falha catastrófica no executor de testes adversariais:', err);
  process.exit(1);
});
