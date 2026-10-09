import http from 'http';
import app from '../src/app';
import { getDatabase } from '../src/db/factory';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Iniciando Suíte de Testes Automatizados - os-service');
  console.log('====================================================\n');

  // Garante inicialização prévia do banco de dados
  const db = await getDatabase();
  console.log(`📦 Banco de dados para testes: ${db.getProviderName()}\n`);

  // Inicializa servidor em porta efêmera aleatória
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Mensagem de erro: ${err.message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. Health Check & Observability
    // -------------------------------------------------------------
    await test('GET /health retorna 200 com status UP e database connected', async () => {
      const res = await fetch(`${baseUrl}/health`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any;
      if (body.status !== 'UP') throw new Error(`Status esperado 'UP', recebido '${body.status}'`);
      if (body.service !== 'os-service') throw new Error(`Service esperado 'os-service', recebido '${body.service}'`);
      if (body.database !== 'connected') throw new Error(`Database esperado 'connected', recebido '${body.database}'`);
    });

    await test('GET /api-docs.json retorna especificação OpenAPI 3.0 válida', async () => {
      const res = await fetch(`${baseUrl}/api-docs.json`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any;
      if (!body.openapi || !body.openapi.startsWith('3.')) throw new Error('Campo openapi versão 3.x ausente');
      if (!body.paths || !body.paths['/api/ordens']) throw new Error('Path /api/ordens ausente no OpenAPI spec');
    });

    await test('GET / redireciona para /api-docs (Swagger UI)', async () => {
      const res = await fetch(`${baseUrl}/`, { redirect: 'manual' });
      if (res.status !== 302) throw new Error(`Esperado HTTP 302 redirect, recebido ${res.status}`);
      const location = res.headers.get('location');
      if (location !== '/api-docs') throw new Error(`Location esperada '/api-docs', recebida '${location}'`);
    });

    // -------------------------------------------------------------
    // 2. Listagem e Filtros
    // -------------------------------------------------------------
    let seedCount = 0;
    await test('GET /api/ordens lista todas as ordens (incluindo seeds iniciais)', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any[];
      if (!Array.isArray(body)) throw new Error('Resposta deve ser um array');
      if (body.length < 5) throw new Error(`Esperado pelo menos 5 seeds, recebido ${body.length}`);
      seedCount = body.length;
    });

    await test('GET /api/ordens?status=Aberta filtra ordens por status', async () => {
      const res = await fetch(`${baseUrl}/api/ordens?status=Aberta`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any[];
      if (!Array.isArray(body)) throw new Error('Resposta deve ser um array');
      for (const item of body) {
        if (item.status !== 'Aberta') throw new Error(`Encontrado item com status diferente: ${item.status}`);
      }
    });

    await test('GET /api/ordens?prioridade=Alta filtra ordens por prioridade', async () => {
      const res = await fetch(`${baseUrl}/api/ordens?prioridade=Alta`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any[];
      if (!Array.isArray(body)) throw new Error('Resposta deve ser um array');
      for (const item of body) {
        if (item.prioridade !== 'Alta') throw new Error(`Encontrado item com prioridade diferente: ${item.prioridade}`);
      }
    });

    await test('GET /api/ordens?cliente=Inexistente_XYZ_999 retorna 200 com array vazio', async () => {
      const res = await fetch(`${baseUrl}/api/ordens?cliente=Inexistente_XYZ_999`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any[];
      if (!Array.isArray(body) || body.length !== 0) throw new Error('Esperado array vazio');
    });

    // -------------------------------------------------------------
    // 3. Criação de Ordens (POST /api/ordens)
    // -------------------------------------------------------------
    let createdId1: number = 0;
    await test('POST /api/ordens cadastra nova OS válida e retorna 201', async () => {
      const payload = {
        cliente: 'Hospital Central São Lucas',
        descricao: 'Manutenção em sistema central de ar medicinal',
        prioridade: 'Alta',
        status: 'Aberta',
        valor_estimado: 2450.50,
        prazo: '2026-11-20'
      };
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status !== 201) throw new Error(`Esperado HTTP 201, recebido ${res.status}`);
      const data = await res.json() as any;
      if (!data.id) throw new Error('ID ausente na resposta de criação');
      if (data.cliente !== payload.cliente) throw new Error('Nome do cliente diverge');
      if (data.status !== 'Aberta') throw new Error('Status diverge de Aberta');
      if (data.valor_estimado !== 2450.50) throw new Error('Valor estimado diverge');
      createdId1 = data.id;
    });

    await test('POST /api/ordens com cliente ausente retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: 'Sem cliente informado' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('POST /api/ordens com descricao vazia retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: 'Cliente Válido', descricao: '   ' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('POST /api/ordens com prioridade inválida retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: 'Cliente A', descricao: 'Desc', prioridade: 'UltraMega' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('POST /api/ordens com status inválido retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: 'Cliente A', descricao: 'Desc', status: 'EmAnalise' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('POST /api/ordens com valor_estimado negativo retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: 'Cliente A', descricao: 'Desc', valor_estimado: -50.0 })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('POST /api/ordens com status Agendada sem técnico retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: 'Cliente A', descricao: 'Desc', status: 'Agendada' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('POST /api/ordens com status Agendada e técnico atribuído retorna 201', async () => {
      const res = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Clínica Bem Estar',
          descricao: 'Troca de compressor',
          status: 'Agendada',
          tecnico: 'Rafael Lima'
        })
      });
      if (res.status !== 201) throw new Error(`Esperado HTTP 201, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.tecnico !== 'Rafael Lima') throw new Error('Técnico atribuído não persistido');
    });

    // -------------------------------------------------------------
    // 4. Detalhamento (GET /api/ordens/:id)
    // -------------------------------------------------------------
    await test('GET /api/ordens/:id retorna 200 com os dados da OS', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.id !== createdId1) throw new Error(`ID esperado ${createdId1}, recebido ${data.id}`);
      if (data.cliente !== 'Hospital Central São Lucas') throw new Error('Cliente divergente');
    });

    await test('GET /api/ordens/:id com ID inexistente retorna 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/999999`);
      if (res.status !== 404) throw new Error(`Esperado HTTP 404, recebido ${res.status}`);
    });

    await test('GET /api/ordens/:id com ID não numérico retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/nao-e-numero`);
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    // -------------------------------------------------------------
    // 5. Atualização Cadastral (PUT /api/ordens/:id)
    // -------------------------------------------------------------
    await test('PUT /api/ordens/:id atualiza dados cadastrais da OS e retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: 'Manutenção preventiva ampliada e teste de pressão',
          valor_estimado: 2900.00
        })
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.descricao !== 'Manutenção preventiva ampliada e teste de pressão') {
        throw new Error('Descrição não foi atualizada');
      }
      if (data.valor_estimado !== 2900.00) throw new Error('Valor estimado não foi atualizado');
    });

    await test('PUT /api/ordens/:id com ID inexistente retorna 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/999999`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: 'Nova desc' })
      });
      if (res.status !== 404) throw new Error(`Esperado HTTP 404, recebido ${res.status}`);
    });

    await test('PUT /api/ordens/:id com valor negativo retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_estimado: -100 })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    // -------------------------------------------------------------
    // 6. Ciclo de Vida e State Machine (PATCH /api/ordens/:id/status)
    // -------------------------------------------------------------
    // Ordem criada está como 'Aberta' e sem técnico.
    await test('PATCH /api/ordens/:id/status para Agendada sem técnico retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Agendada' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('PATCH /api/ordens/:id/status para Agendada fornecendo técnico retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Agendada', tecnico: 'Jonas Sena' })
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.status !== 'Agendada') throw new Error(`Status esperado Agendada, recebido ${data.status}`);
      if (data.tecnico !== 'Jonas Sena') throw new Error(`Técnico esperado Jonas Sena, recebido ${data.tecnico}`);
    });

    await test('PATCH /api/ordens/:id/status pulando etapas (Agendada -> Concluída) retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluída' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('PATCH /api/ordens/:id/status para Em Execução retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Em Execução' })
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.status !== 'Em Execução') throw new Error(`Status esperado Em Execução, recebido ${data.status}`);
    });

    await test('PATCH /api/ordens/:id/status para Concluída retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluída' })
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.status !== 'Concluída') throw new Error(`Status esperado Concluída, recebido ${data.status}`);
    });

    await test('PATCH /api/ordens/:id/status a partir do estado terminal Concluída retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aberta' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    // Teste de cancelamento e proteção de estado terminal Cancelada
    let canceladaId: number = 0;
    await test('Transição Aberta -> Cancelada retorna 200 e bloqueia novas transições', async () => {
      // Cria uma nova OS
      const createRes = await fetch(`${baseUrl}/api/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Escritório ABC',
          descricao: 'Troca de filtro',
          status: 'Aberta'
        })
      });
      const novaOS = await createRes.json() as any;
      canceladaId = novaOS.id;

      // Cancela a OS
      const cancelRes = await fetch(`${baseUrl}/api/ordens/${canceladaId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelada' })
      });
      if (cancelRes.status !== 200) throw new Error(`Esperado HTTP 200 no cancelamento, recebido ${cancelRes.status}`);

      // Tenta reabrir a OS cancelada
      const reabrirRes = await fetch(`${baseUrl}/api/ordens/${canceladaId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aberta' })
      });
      if (reabrirRes.status !== 400) throw new Error(`Esperado HTTP 400 ao transicionar de Cancelada, recebido ${reabrirRes.status}`);
    });

    // -------------------------------------------------------------
    // 7. Remoção (DELETE /api/ordens/:id)
    // -------------------------------------------------------------
    await test('DELETE /api/ordens/:id remove OS com sucesso e retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}`, {
        method: 'DELETE'
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (!data.message || !data.message.includes('removida com sucesso')) {
        throw new Error('Mensagem de sucesso ausente');
      }
    });

    await test('GET /api/ordens/:id após exclusão retorna 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}`);
      if (res.status !== 404) throw new Error(`Esperado HTTP 404, recebido ${res.status}`);
    });

    await test('DELETE /api/ordens/:id repetido retorna 404', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${createdId1}`, {
        method: 'DELETE'
      });
      if (res.status !== 404) throw new Error(`Esperado HTTP 404, recebido ${res.status}`);
    });

    await test('DELETE /api/ordens/:id com ID não numérico retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/nao-e-numero`, {
        method: 'DELETE'
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    // Deleta a segunda OS de teste criada
    await test('DELETE /api/ordens/:id para segunda OS de teste retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/ordens/${canceladaId}`, {
        method: 'DELETE'
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
    });

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try {
      await db.close();
    } catch {
      // Ignora erro de fechamento se já encerrado
    }
  }

  console.log('\n====================================================');
  console.log(`📊 Testes Concluídos: ${passed} passaram, ${failed} falharam.`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Falha crítica na execução dos testes:', err);
  process.exit(1);
});
