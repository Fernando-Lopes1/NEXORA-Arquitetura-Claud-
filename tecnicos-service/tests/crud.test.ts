import http from 'http';
import app from '../src/app';
import { getDatabase } from '../src/db/factory';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Iniciando Suíte de Testes Automatizados - tecnicos-service');
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
      if (body.service !== 'tecnicos-service') throw new Error(`Service esperado 'tecnicos-service', recebido '${body.service}'`);
      if (body.database !== 'connected') throw new Error(`Database esperado 'connected', recebido '${body.database}'`);
      if (!body.provider) throw new Error('Campo provider ausente no health check');
      if (typeof body.uptime !== 'number') throw new Error('Campo uptime inválido');
    });

    await test('GET /api-docs.json retorna especificação OpenAPI 3.0 válida', async () => {
      const res = await fetch(`${baseUrl}/api-docs.json`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any;
      if (!body.openapi || !body.openapi.startsWith('3.')) throw new Error('Campo openapi versão 3.x ausente');
      if (!body.paths || !body.paths['/api/tecnicos']) throw new Error('Path /api/tecnicos ausente no OpenAPI spec');
      if (!body.paths['/api/tecnicos/{id}/disponibilidade']) throw new Error('Path /api/tecnicos/{id}/disponibilidade ausente');
    });

    await test('GET / redireciona para /api-docs (Swagger UI)', async () => {
      const res = await fetch(`${baseUrl}/`, { redirect: 'manual' });
      if (res.status !== 302) throw new Error(`Esperado HTTP 302 redirect, recebido ${res.status}`);
      const location = res.headers.get('location');
      if (location !== '/api-docs') throw new Error(`Location esperada '/api-docs', recebida '${location}'`);
    });

    // -------------------------------------------------------------
    // 2. Listagem e Filtros com Seeds Iniciais
    // -------------------------------------------------------------
    await test('GET /api/tecnicos lista todos os técnicos (incluindo 5 seeds iniciais)', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any[];
      if (!Array.isArray(body)) throw new Error('Resposta deve ser um array');
      if (body.length < 5) throw new Error(`Esperado pelo menos 5 seeds, recebido ${body.length}`);
      
      const nomes = body.map(t => t.nome);
      if (!nomes.includes('Fernando Lopes')) throw new Error('Seed Fernando Lopes ausente');
      if (!nomes.includes('Carlos Silva')) throw new Error('Seed Carlos Silva ausente');
      if (!nomes.includes('Mariana Souza')) throw new Error('Seed Mariana Souza ausente');
      if (!nomes.includes('Roberto Mendes')) throw new Error('Seed Roberto Mendes ausente');
      if (!nomes.includes('Juliana Lima')) throw new Error('Seed Juliana Lima ausente');
    });

    await test('GET /api/tecnicos?especialidade=Climatização filtra técnicos por especialidade', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos?especialidade=Climatização`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any[];
      if (!Array.isArray(body)) throw new Error('Resposta deve ser um array');
      if (body.length < 2) throw new Error(`Esperado pelo menos 2 técnicos de Climatização, recebido ${body.length}`);
      for (const item of body) {
        if (item.especialidade.toLowerCase() !== 'climatização') {
          throw new Error(`Encontrado técnico com especialidade diferente: ${item.especialidade}`);
        }
      }
    });

    await test('GET /api/tecnicos?status=Disponível filtra técnicos por disponibilidade', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos?status=Disponível`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any[];
      if (!Array.isArray(body)) throw new Error('Resposta deve ser um array');
      if (body.length < 3) throw new Error(`Esperado pelo menos 3 técnicos Disponíveis, recebido ${body.length}`);
      for (const item of body) {
        if (item.status.toLowerCase() !== 'disponível') {
          throw new Error(`Encontrado técnico com status diferente: ${item.status}`);
        }
      }
    });

    await test('GET /api/tecnicos?regiao=Centro filtra técnicos por região', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos?regiao=Centro`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any[];
      if (!Array.isArray(body)) throw new Error('Resposta deve ser um array');
      if (body.length < 1) throw new Error('Esperado pelo menos 1 técnico na região Centro');
      const carlos = body.find(t => t.nome === 'Carlos Silva');
      if (!carlos) throw new Error('Carlos Silva não encontrado na busca da região Centro');
    });

    await test('GET /api/tecnicos?regiao=Inexistente_XYZ_999 retorna 200 com array vazio', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos?regiao=Inexistente_XYZ_999`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const body = await res.json() as any[];
      if (!Array.isArray(body) || body.length !== 0) throw new Error('Esperado array vazio');
    });

    // -------------------------------------------------------------
    // 3. Cadastro de Técnicos (POST /api/tecnicos)
    // -------------------------------------------------------------
    let createdTecnicoId: number = 0;

    await test('POST /api/tecnicos cadastra novo técnico válido e retorna 201', async () => {
      const payload = {
        nome: 'Lucas Albuquerque',
        especialidade: 'Mecânica',
        telefone: '(11) 91234-5678',
        email: 'lucas.albuquerque@nexora.com.br',
        regiao: 'São Paulo - Grande ABC',
        status: 'Disponível'
      };
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status !== 201) throw new Error(`Esperado HTTP 201, recebido ${res.status}`);
      const data = await res.json() as any;
      if (!data.id) throw new Error('ID ausente na resposta de criação');
      if (data.nome !== payload.nome) throw new Error('Nome diverge do payload');
      if (data.especialidade !== payload.especialidade) throw new Error('Especialidade diverge do payload');
      if (data.email !== payload.email) throw new Error('Email diverge');
      if (data.status !== 'Disponível') throw new Error('Status diverge de Disponível');
      createdTecnicoId = data.id;
    });

    let minimalTecnicoId: number = 0;
    await test('POST /api/tecnicos com campos mínimos atribui status padrão Disponível', async () => {
      const payload = {
        nome: 'Ana Clara Peixoto',
        especialidade: 'Elétrica'
      };
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status !== 201) throw new Error(`Esperado HTTP 201, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.status !== 'Disponível') throw new Error(`Status padrão esperado 'Disponível', recebido '${data.status}'`);
      if (data.telefone !== null) throw new Error('Telefone deveria ser null');
      if (data.email !== null) throw new Error('Email deveria ser null');
      minimalTecnicoId = data.id;
    });

    await test('POST /api/tecnicos com nome ausente retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ especialidade: 'Climatização' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('POST /api/tecnicos com nome em branco retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: '    ', especialidade: 'Climatização' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('POST /api/tecnicos com especialidade ausente retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'João Teste' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('POST /api/tecnicos com especialidade inválida retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'João Teste', especialidade: 'Pintura Predial' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
      const body = await res.json() as any;
      if (!body.erro || !body.erro.includes('Especialidade inválida')) {
        throw new Error('Mensagem de erro não explicita especialidade inválida');
      }
    });

    await test('POST /api/tecnicos com formato de email inválido retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'João Teste',
          especialidade: 'Climatização',
          email: 'email_sem_arroba_ponto_com'
        })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
      const body = await res.json() as any;
      if (!body.erro || !body.erro.includes('E-mail inválido')) {
        throw new Error('Mensagem de erro não explicita email inválido');
      }
    });

    await test('POST /api/tecnicos com status de disponibilidade inválido retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'João Teste',
          especialidade: 'Climatização',
          status: 'Em Férias'
        })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
      const body = await res.json() as any;
      if (!body.erro || !body.erro.includes('Status de disponibilidade inválido')) {
        throw new Error('Mensagem de erro não explicita status inválido');
      }
    });

    // -------------------------------------------------------------
    // 4. Detalhamento (GET /api/tecnicos/:id)
    // -------------------------------------------------------------
    await test('GET /api/tecnicos/:id retorna 200 com os dados do técnico', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}`);
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.id !== createdTecnicoId) throw new Error(`ID esperado ${createdTecnicoId}, recebido ${data.id}`);
      if (data.nome !== 'Lucas Albuquerque') throw new Error('Nome divergente');
      if (data.especialidade !== 'Mecânica') throw new Error('Especialidade divergente');
    });

    await test('GET /api/tecnicos/:id com ID inexistente retorna 404', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/999999`);
      if (res.status !== 404) throw new Error(`Esperado HTTP 404, recebido ${res.status}`);
    });

    await test('GET /api/tecnicos/:id com ID não numérico retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/invalido`);
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('GET /api/tecnicos/:id com ID zero ou negativo retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/0`);
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    // -------------------------------------------------------------
    // 5. Atualização Cadastral (PUT /api/tecnicos/:id)
    // -------------------------------------------------------------
    await test('PUT /api/tecnicos/:id atualiza dados cadastrais e retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Lucas Albuquerque Ramos',
          especialidade: 'Refrigeração',
          regiao: 'São Paulo - Zona Sul e ABC'
        })
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.nome !== 'Lucas Albuquerque Ramos') throw new Error('Nome não atualizado');
      if (data.especialidade !== 'Refrigeração') throw new Error('Especialidade não atualizada');
      if (data.regiao !== 'São Paulo - Zona Sul e ABC') throw new Error('Região não atualizada');
    });

    await test('PUT /api/tecnicos/:id com ID inexistente retorna 404', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/999999`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Nome Teste' })
      });
      if (res.status !== 404) throw new Error(`Esperado HTTP 404, recebido ${res.status}`);
    });

    await test('PUT /api/tecnicos/:id com especialidade inválida retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ especialidade: 'Marcenaria' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    await test('PUT /api/tecnicos/:id com email malformatado retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'formato-invalido' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    // -------------------------------------------------------------
    // 6. Atualização de Disponibilidade (PATCH /api/tecnicos/:id/disponibilidade)
    // -------------------------------------------------------------
    await test('PATCH /api/tecnicos/:id/disponibilidade altera para Em Atendimento e retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Em Atendimento' })
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.status !== 'Em Atendimento') throw new Error(`Status esperado 'Em Atendimento', recebido '${data.status}'`);
    });

    await test('PATCH /api/tecnicos/:id/disponibilidade aceita campo disponibilidade no body', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponibilidade: 'Ausente' })
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.status !== 'Ausente') throw new Error(`Status esperado 'Ausente', recebido '${data.status}'`);
    });

    await test('PATCH /api/tecnicos/:id/disponibilidade restaura para Disponível', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Disponível' })
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.status !== 'Disponível') throw new Error(`Status esperado 'Disponível', recebido '${data.status}'`);
    });

    await test('PATCH /api/tecnicos/:id/disponibilidade com status inválido retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ocupado' })
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
      const data = await res.json() as any;
      if (!data.erro || !data.erro.includes('Status de disponibilidade inválido')) {
        throw new Error('Mensagem de erro não descreve status inválido');
      }
    });

    await test('PATCH /api/tecnicos/:id/disponibilidade com ID inexistente retorna 404', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/999999/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ausente' })
      });
      if (res.status !== 404) throw new Error(`Esperado HTTP 404, recebido ${res.status}`);
    });

    // -------------------------------------------------------------
    // 7. Remoção de Técnicos (DELETE /api/tecnicos/:id)
    // -------------------------------------------------------------
    await test('DELETE /api/tecnicos/:id remove técnico e retorna 200 com mensagem', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}`, {
        method: 'DELETE'
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
      const data = await res.json() as any;
      if (!data.message || !data.message.includes('removido com sucesso')) {
        throw new Error('Mensagem de sucesso ausente');
      }
      if (data.id !== createdTecnicoId) throw new Error('ID incorreto na resposta de remoção');
    });

    await test('GET /api/tecnicos/:id após remoção retorna 404', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}`);
      if (res.status !== 404) throw new Error(`Esperado HTTP 404 após remoção, recebido ${res.status}`);
    });

    await test('DELETE /api/tecnicos/:id duplicado retorna 404', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${createdTecnicoId}`, {
        method: 'DELETE'
      });
      if (res.status !== 404) throw new Error(`Esperado HTTP 404 em deleção repetida, recebido ${res.status}`);
    });

    await test('DELETE /api/tecnicos/:id com ID não numérico retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/nao-numerico`, {
        method: 'DELETE'
      });
      if (res.status !== 400) throw new Error(`Esperado HTTP 400, recebido ${res.status}`);
    });

    // Limpa o segundo técnico criado durante os testes
    await test('DELETE /api/tecnicos/:id limpa técnico secundário de teste', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${minimalTecnicoId}`, {
        method: 'DELETE'
      });
      if (res.status !== 200) throw new Error(`Esperado HTTP 200, recebido ${res.status}`);
    });

    // -------------------------------------------------------------
    // 8. Rotas não mapeadas
    // -------------------------------------------------------------
    await test('GET em rota não existente retorna 404 com mensagem descritiva', async () => {
      const res = await fetch(`${baseUrl}/api/rotas-que-nao-existem`);
      if (res.status !== 404) throw new Error(`Esperado HTTP 404, recebido ${res.status}`);
      const data = await res.json() as any;
      if (!data.erro) throw new Error('Campo erro ausente na resposta 404');
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
