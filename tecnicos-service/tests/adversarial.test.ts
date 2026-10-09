import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../src/app';
import { getDatabase } from '../src/db/factory';

interface AdversarialTestCase {
  category: string;
  name: string;
  run: (baseUrl: string) => Promise<void>;
}

async function runAdversarialSuite() {
  console.log('======================================================================');
  console.log('🔥 INICIANDO SUÍTE ADVERSARIAL E STRESS-TEST: tecnicos-service');
  console.log('======================================================================\n');

  // 1. Inicializa o banco de dados
  const db = await getDatabase();
  console.log(`📦 Provedor de Banco de Dados Ativo: ${db.getProviderName()}`);

  // 2. Sobe servidor em porta efêmera
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`🚀 Servidor de testes em execução em ${baseUrl}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failures: { name: string; error: string }[] = [];

  async function executeTest(category: string, name: string, fn: () => Promise<void>) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✅ [PASS] [${category}] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] [${category}] ${name}`);
      console.error(`     Detalhes: ${err.message}`);
      failedTests++;
      failures.push({ name: `[${category}] ${name}`, error: err.message });
    }
  }

  try {
    // =====================================================================
    // CATEGORIA 1: Availability State Fuzzing & Illegal Statuses
    // =====================================================================
    const invalidStatuses = [
      'Dormindo',
      'Ocupado',
      'Inativo',
      'Férias',
      'Offline',
      'disponivel', // minúsculo não homologado
      'EM ATENDIMENTO', // maiúsculo não homologado
      'ausente'
    ];

    for (const badStatus of invalidStatuses) {
      await executeTest('Status Enum Fuzzing', `POST rejeita status inválido '${badStatus}' com 400`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: 'Técnico Fuzz',
            especialidade: 'Climatização',
            status: badStatus
          })
        });
        if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
        const data = await res.json() as any;
        if (!data.erro) throw new Error('Campo erro ausente na resposta');
      });

      await executeTest('Status Enum Fuzzing', `PATCH /disponibilidade rejeita '${badStatus}' com 400`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/1/disponibilidade`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: badStatus })
        });
        if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
      });
    }

    // Tipos de dados não-string em status
    await executeTest('Status Enum Fuzzing', 'PATCH /disponibilidade com status numérico rejeita com 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/1/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 12345 })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await executeTest('Status Enum Fuzzing', 'PATCH /disponibilidade com status boolean rejeita com 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/1/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: true })
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await executeTest('Status Enum Fuzzing', 'PATCH /disponibilidade com body vazio ({}) rejeita com 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/1/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    // =====================================================================
    // CATEGORIA 2: Specialty Enumeration Fuzzing
    // =====================================================================
    const invalidSpecialties = [
      'Pintura',
      'Marcenaria',
      'Engenharia Civil',
      'Pedreiro',
      'TI',
      'climatização', // case-sensitive test
      'eletrica', // sem acento
      'ELETRICA',
      'Mecanica' // sem acento
    ];

    for (const badSpec of invalidSpecialties) {
      await executeTest('Specialty Fuzzing', `POST rejeita especialidade inválida '${badSpec}' com 400`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: 'Técnico Especialidade Fuzz',
            especialidade: badSpec
          })
        });
        if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
        const data = await res.json() as any;
        if (!data.erro) throw new Error('Campo erro ausente na resposta');
      });

      await executeTest('Specialty Fuzzing', `PUT rejeita especialidade inválida '${badSpec}' com 400`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/1`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ especialidade: badSpec })
        });
        if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
      });
    }

    // =====================================================================
    // CATEGORIA 3: Malformed Email Syntaxes Fuzzing
    // =====================================================================
    const malformedEmails = [
      'plainaddress',
      '@missingusername.com',
      'missingdomain@',
      'user@domain', // sem ponto/TLD
      'user@.com',
      'user @domain.com',
      'user@ domain.com',
      'nao_e_email',
      'http://site.com',
      '123456'
    ];

    for (const badMail of malformedEmails) {
      await executeTest('Email Fuzzing', `POST rejeita email malformado '${badMail}' com 400`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: 'Técnico Email Fuzz',
            especialidade: 'Climatização',
            email: badMail
          })
        });
        if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
        const data = await res.json() as any;
        if (!data.erro || !data.erro.includes('E-mail inválido')) {
          throw new Error(`Mensagem não identificou e-mail inválido: ${data.erro}`);
        }
      });
    }

    await executeTest('Email Fuzzing', 'POST aceita e-mail vazio ou ausente sem rejeitar', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Técnico Sem Email',
          especialidade: 'Climatização',
          email: ''
        })
      });
      if (res.status !== 201) throw new Error(`Esperado 201, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.email !== null) throw new Error('Email deveria ser null');
      // Limpeza
      await fetch(`${baseUrl}/api/tecnicos/${data.id}`, { method: 'DELETE' });
    });

    // =====================================================================
    // CATEGORIA 4: SQL Injection Probing & Parameter Sanitization
    // =====================================================================
    const sqlInjections = [
      "' OR '1'='1",
      "'; DROP TABLE tecnicos; --",
      "' UNION SELECT 1, 'admin', 'Elétrica', 'x', 'x@x.com', 'x', 'Disponível', 'x', 'x' --",
      "1; SELECT pg_sleep(5); --",
      "admin'--"
    ];

    for (const sqli of sqlInjections) {
      await executeTest('SQL Injection Probing', `GET com filtro especialidade contendo SQLi [${sqli}] não quebra e retorna 200`, async () => {
        const url = `${baseUrl}/api/tecnicos?especialidade=${encodeURIComponent(sqli)}`;
        const res = await fetch(url);
        if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
        const data = await res.json() as any[];
        if (!Array.isArray(data)) throw new Error('Resposta deve ser array');
      });

      await executeTest('SQL Injection Probing', `GET com filtro regiao contendo SQLi [${sqli}] não quebra e retorna 200`, async () => {
        const url = `${baseUrl}/api/tecnicos?regiao=${encodeURIComponent(sqli)}`;
        const res = await fetch(url);
        if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
        const data = await res.json() as any[];
        if (!Array.isArray(data)) throw new Error('Resposta deve ser array');
      });
    }

    // Injeção SQL na rota parametrizada ID
    await executeTest('SQL Injection Probing', 'GET /api/tecnicos/1;DROP TABLE tecnicos;-- retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${encodeURIComponent('1;DROP TABLE tecnicos;--')}`);
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await executeTest('SQL Injection Probing', "GET /api/tecnicos/' OR 1=1 -- retorna 400", async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos/${encodeURIComponent("' OR 1=1 --")}`);
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    // Injeção de payload no corpo (persistência segura como texto puro)
    let sqliTecnicoId: number = 0;
    await executeTest('SQL Injection Probing', 'POST com payload SQLi em "nome" persiste como string literal segura', async () => {
      const sqliName = "Robert'); DROP TABLE tecnicos;--";
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: sqliName,
          especialidade: 'Mecânica'
        })
      });
      if (res.status !== 201) throw new Error(`Esperado 201, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.nome !== sqliName) throw new Error('Nome literal não foi preservado');
      sqliTecnicoId = data.id;

      // Confirma que a tabela tecnicos NÃO foi dropada
      const checkRes = await fetch(`${baseUrl}/api/tecnicos`);
      if (checkRes.status !== 200) throw new Error('Tabela tecnicos parece ter sido corrompida!');
      const all = await checkRes.json() as any[];
      if (all.length < 5) throw new Error('Dados foram perdidos');
    });

    // Limpa técnico de teste de SQLi
    if (sqliTecnicoId > 0) {
      await executeTest('SQL Injection Probing', 'DELETE do técnico com nome contendo SQLi funciona normalmente', async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/${sqliTecnicoId}`, { method: 'DELETE' });
        if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
      });
    }

    // =====================================================================
    // CATEGORIA 5: Boundary Conditions, Malformed IDs, Negative IDs
    // =====================================================================
    const malformedIds = [
      '0',
      '-1',
      '-99999',
      '1.5',
      'abc',
      'null',
      'undefined',
      'NaN',
      'true'
    ];

    for (const badId of malformedIds) {
      await executeTest('ID Boundary Testing', `GET /api/tecnicos/${badId} retorna 400`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/${badId}`);
        if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
      });

      await executeTest('ID Boundary Testing', `PUT /api/tecnicos/${badId} retorna 400`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/${badId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: 'Teste' })
        });
        if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
      });

      await executeTest('ID Boundary Testing', `PATCH /api/tecnicos/${badId}/disponibilidade retorna 400`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/${badId}/disponibilidade`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Disponível' })
        });
        if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
      });

      await executeTest('ID Boundary Testing', `DELETE /api/tecnicos/${badId} retorna 400`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/${badId}`, { method: 'DELETE' });
        if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
      });
    }

    // IDs inexistentes (números inteiros positivos que não existem no banco)
    const nonExistentIds = [999999, 888888, 777777, 100000];
    for (const nonId of nonExistentIds) {
      await executeTest('Non-Existent ID Handling', `GET /api/tecnicos/${nonId} retorna 404`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/${nonId}`);
        if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
      });

      await executeTest('Non-Existent ID Handling', `PUT /api/tecnicos/${nonId} retorna 404`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/${nonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: 'Nome Inexistente' })
        });
        if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
      });

      await executeTest('Non-Existent ID Handling', `PATCH /api/tecnicos/${nonId}/disponibilidade retorna 404`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/${nonId}/disponibilidade`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Ausente' })
        });
        if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
      });

      await executeTest('Non-Existent ID Handling', `DELETE /api/tecnicos/${nonId} retorna 404`, async () => {
        const res = await fetch(`${baseUrl}/api/tecnicos/${nonId}`, { method: 'DELETE' });
        if (res.status !== 404) throw new Error(`Esperado 404, recebido ${res.status}`);
      });
    }

    // =====================================================================
    // CATEGORIA 6: Idempotent Deletes & Lifecycle Cycles
    // =====================================================================
    await executeTest('Idempotent Deletes', 'Ciclo completo: Criação -> Remoção (200) -> Remoção repetida (404) -> Acesso (404)', async () => {
      // Cria
      const createRes = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Técnico Ciclo Deleção',
          especialidade: 'Elétrica'
        })
      });
      if (createRes.status !== 201) throw new Error(`Falha ao criar: ${createRes.status}`);
      const created = await createRes.json() as any;
      const id = created.id;

      // Primeira deleção -> 200
      const del1 = await fetch(`${baseUrl}/api/tecnicos/${id}`, { method: 'DELETE' });
      if (del1.status !== 200) throw new Error(`Primeira deleção esperava 200, recebeu ${del1.status}`);

      // Segunda deleção (repetida) -> 404
      const del2 = await fetch(`${baseUrl}/api/tecnicos/${id}`, { method: 'DELETE' });
      if (del2.status !== 404) throw new Error(`Segunda deleção esperava 404, recebeu ${del2.status}`);

      // Terceira deleção (repetida) -> 404
      const del3 = await fetch(`${baseUrl}/api/tecnicos/${id}`, { method: 'DELETE' });
      if (del3.status !== 404) throw new Error(`Terceira deleção esperava 404, recebeu ${del3.status}`);

      // GET subsequente -> 404
      const getRes = await fetch(`${baseUrl}/api/tecnicos/${id}`);
      if (getRes.status !== 404) throw new Error(`GET pós-deleção esperava 404, recebeu ${getRes.status}`);

      // PUT subsequente -> 404
      const putRes = await fetch(`${baseUrl}/api/tecnicos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Reviver' })
      });
      if (putRes.status !== 404) throw new Error(`PUT pós-deleção esperava 404, recebeu ${putRes.status}`);

      // PATCH subsequente -> 404
      const patchRes = await fetch(`${baseUrl}/api/tecnicos/${id}/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Disponível' })
      });
      if (patchRes.status !== 404) throw new Error(`PATCH pós-deleção esperava 404, recebeu ${patchRes.status}`);
    });

    // =====================================================================
    // CATEGORIA 7: Malformed Request Bodies & Protocol Violations
    // =====================================================================
    await executeTest('Malformed Request Bodies', 'JSON sintaticamente quebrado retorna 400 sem crash do processo', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "nome": "Incompleto", ' // JSON quebrado
      });
      // Express default JSON parser retorna 400
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await executeTest('Malformed Request Bodies', 'POST com JSON Array ([]) retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([1, 2, 3])
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await executeTest('Malformed Request Bodies', 'POST com JSON primitivo (string "teste") retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('apenas uma string')
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await executeTest('Malformed Request Bodies', 'POST com JSON primitivo (número 42) retorna 400', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(42)
      });
      if (res.status !== 400) throw new Error(`Esperado 400, recebido ${res.status}`);
    });

    await executeTest('Malformed Request Bodies', 'POST com string gigante (50KB) em nome não quebra o serviço', async () => {
      const hugeName = 'A'.repeat(50000);
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: hugeName,
          especialidade: 'Climatização'
        })
      });
      if (res.status !== 201) throw new Error(`Esperado 201, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.nome.length !== 50000) throw new Error('Nome gigante foi truncado ou corrompido');
      // Limpeza imediata
      await fetch(`${baseUrl}/api/tecnicos/${data.id}`, { method: 'DELETE' });
    });

    await executeTest('Malformed Request Bodies', 'POST com caracteres XSS (<script>alert(1)</script>) persiste com segurança', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const res = await fetch(`${baseUrl}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: xssPayload,
          especialidade: 'Refrigeração'
        })
      });
      if (res.status !== 201) throw new Error(`Esperado 201, recebido ${res.status}`);
      const data = await res.json() as any;
      if (data.nome !== xssPayload) throw new Error('Payload XSS modificado incorretamente');
      // Valida headers de resposta segura
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Content-Type inseguro: ${contentType}`);
      }
      await fetch(`${baseUrl}/api/tecnicos/${data.id}`, { method: 'DELETE' });
    });

    // =====================================================================
    // CATEGORIA 8: Query Parameter Fuzzing & Combinations
    // =====================================================================
    await executeTest('Query Filter Fuzzing', 'GET /api/tecnicos com parâmetros vazios (?especialidade=&status=&regiao=) retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos?especialidade=&status=&regiao=`);
      if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
      const data = await res.json() as any[];
      if (!Array.isArray(data) || data.length < 5) throw new Error('Deveria retornar lista completa');
    });

    await executeTest('Query Filter Fuzzing', 'GET /api/tecnicos com múltiplos filtros válidos simultâneos retorna interseção correta', async () => {
      // Seed 1: Fernando Lopes - Climatização - Disponível - São Paulo - Zona Sul
      const res = await fetch(`${baseUrl}/api/tecnicos?especialidade=Climatização&status=Disponível&regiao=Sul`);
      if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
      const data = await res.json() as any[];
      if (data.length < 1) throw new Error('Esperado Fernando Lopes nos resultados');
      if (data[0].nome !== 'Fernando Lopes') throw new Error(`Esperado Fernando Lopes, recebido ${data[0].nome}`);
    });

    await executeTest('Query Filter Fuzzing', 'GET /api/tecnicos com caracteres especiais de regex em regiao funciona sem erro', async () => {
      const res = await fetch(`${baseUrl}/api/tecnicos?regiao=${encodeURIComponent('.*+?^${}()|[]\\')}`);
      if (res.status !== 200) throw new Error(`Esperado 200, recebido ${res.status}`);
      const data = await res.json() as any[];
      if (!Array.isArray(data)) throw new Error('Esperado array');
    });

    // =====================================================================
    // CATEGORIA 9: Concurrency Stress Test
    // =====================================================================
    await executeTest('Concurrency Stress', 'Execução concorrente de 30 operações mistas (GET, POST, PATCH, DELETE)', async () => {
      const concurrentOps = Array.from({ length: 30 }, async (_, i) => {
        if (i % 3 === 0) {
          // POST seguido de DELETE
          const postRes = await fetch(`${baseUrl}/api/tecnicos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome: `Concorrente ${i}`,
              especialidade: 'Climatização'
            })
          });
          if (postRes.status !== 201) throw new Error(`Falha no POST concorrente ${i}`);
          const tech = await postRes.json() as any;
          const delRes = await fetch(`${baseUrl}/api/tecnicos/${tech.id}`, { method: 'DELETE' });
          if (delRes.status !== 200) throw new Error(`Falha no DELETE concorrente ${i}`);
        } else if (i % 3 === 1) {
          // Listagem com filtro
          const listRes = await fetch(`${baseUrl}/api/tecnicos?especialidade=Elétrica`);
          if (listRes.status !== 200) throw new Error(`Falha no GET concorrente ${i}`);
        } else {
          // Health check
          const healthRes = await fetch(`${baseUrl}/health`);
          if (healthRes.status !== 200) throw new Error(`Falha no health concorrente ${i}`);
        }
      });

      await Promise.all(concurrentOps);
    });

    // =====================================================================
    // CATEGORIA 10: Strict Database Isolation Check
    // =====================================================================
    await executeTest('Database Isolation', 'Confirmação física de isolamento: tecnicos-service não contém tabela ordens_servico', async () => {
      const res = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = res.rows.map((r: any) => r.name);
      if (tableNames.includes('ordens_servico')) {
        throw new Error('VIOLAÇÃO CRÍTICA: Tabela ordens_servico encontrada no banco de tecnicos-service!');
      }
      if (!tableNames.includes('tecnicos')) {
        throw new Error('Tabela tecnicos ausente no banco de tecnicos-service!');
      }
    });

    await executeTest('Database Isolation', 'Tentativa de consultar ordens_servico dentro de tecnicos-service lança exceção segura de tabela inexistente', async () => {
      let threw = false;
      try {
        await db.query('SELECT * FROM ordens_servico');
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('no such table')) {
          throw new Error(`Mensagem inesperada: ${err.message}`);
        }
      }
      if (!threw) {
        throw new Error('A consulta a ordens_servico deveria ter falhado!');
      }
    });

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try {
      await db.close();
    } catch {
      // Ignora erro de fechamento se já encerrado
    }
  }

  console.log('\n======================================================================');
  console.log(`📊 RESULTADO FINAL DA SUÍTE ADVERSARIAL:`);
  console.log(`   Total de Testes: ${totalTests}`);
  console.log(`   Sucessos (PASS): ${passedTests}`);
  console.log(`   Falhas (FAIL):   ${failedTests}`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    console.error('❌ Resumo de Falhas:');
    for (const f of failures) {
      console.error(`   - ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('🏆 TODOS OS TESTES ADVERSARIAIS E DE STRESS FORAM APROVADOS COM SUCESSO!');
    process.exit(0);
  }
}

runAdversarialSuite().catch((err) => {
  console.error('Falha catastrófica no executor adversarial:', err);
  process.exit(1);
});
