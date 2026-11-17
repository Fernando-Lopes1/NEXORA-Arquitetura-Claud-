#!/usr/bin/env node
/**
 * Diagnóstico Completo de Configuração Cloud (MongoDB Atlas, Azure SQL Database,
 * Azure Service Bus e Azure App Services) — NEXORA
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    vars[key] = val;
  }
  return vars;
}

async function checkUrl(name, url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    let bodyPreview = '';
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const json = await res.json();
      bodyPreview = JSON.stringify({
        status: json.status || json.fase || 'OK',
        provider: json.provider || json.provedor_ativo || undefined,
        broker: json.broker || undefined,
      });
    }
    return { name, url, ok: res.ok, status: res.status, detail: bodyPreview };
  } catch (err) {
    return { name, url, ok: false, status: 'OFFLINE/TIMEOUT', detail: err.message };
  }
}

async function main() {
  console.log('======================================================================');
  console.log('🔍 DIAGNÓSTICO DE BANCOS DE DADOS & NUVEM AZURE — NEXORA');
  console.log('======================================================================\n');

  const rootEnv = parseEnvFile(path.join(ROOT_DIR, '.env'));
  const osEnv = { ...rootEnv, ...parseEnvFile(path.join(ROOT_DIR, 'os-service/.env')) };
  const tecEnv = { ...rootEnv, ...parseEnvFile(path.join(ROOT_DIR, 'tecnicos-service/.env')) };

  const mongoUri = process.env.MONGODB_URI || tecEnv.MONGODB_URI || '';
  const azureSqlConn = process.env.AZURE_SQL_CONNECTION_STRING || osEnv.AZURE_SQL_CONNECTION_STRING || '';
  const sbConn =
    process.env.AZURE_SERVICE_BUS_CONNECTION_STRING ||
    osEnv.AZURE_SERVICE_BUS_CONNECTION_STRING ||
    tecEnv.AZURE_SERVICE_BUS_CONNECTION_STRING ||
    '';

  console.log('1️⃣  STATUS DAS CREDENCIAIS DE NUVEM LOCAIS (.env):');
  console.log('----------------------------------------------------------------------');
  if (mongoUri) {
    console.log('  🟢 MongoDB Atlas (MONGODB_URI):            CONFIGURADO');
  } else {
    console.log('  🟡 MongoDB Atlas (MONGODB_URI):            NÃO DEFINIDO NO .env (Usando Fallback Local SQLite/In-Memory)');
  }

  if (azureSqlConn) {
    console.log('  🟢 Azure SQL Database (AZURE_SQL_...):     CONFIGURADO');
  } else {
    console.log('  🟡 Azure SQL Database (AZURE_SQL_...):     NÃO DEFINIDO NO .env (Usando Fallback Local SQLite/In-Memory)');
  }

  if (sbConn) {
    console.log('  🟢 Azure Service Bus (AZURE_SERVICE_BUS_): CONFIGURADO');
  } else {
    console.log('  🟡 Azure Service Bus (AZURE_SERVICE_BUS_): NÃO DEFINIDO NO .env (Usando HTTP Broker Bridge / In-Memory)');
  }

  console.log('\n2️⃣  STATUS DOS SERVIÇOS PUBLICADOS NA AZURE (App Services):');
  console.log('----------------------------------------------------------------------');
  const azureTargets = [
    ['API Gateway & BFF', 'https://nexora-gateway-api.azurewebsites.net/api/bff/status'],
    ['Microfrontend 1 (Host OS)', 'https://nexora-host-fernando.azurewebsites.net'],
    ['Microfrontend 2 (Host BI)', 'https://nexora-host-dashboard-fernando.azurewebsites.net'],
    ['Microserviço 2 / Remote 1', 'https://nexora-remote-fernando.azurewebsites.net/health'],
    ['Microserviço 1 / Remote 2', 'https://nexora-remote-dashboard-fernando.azurewebsites.net/health'],
  ];

  const results = await Promise.all(azureTargets.map(([name, url]) => checkUrl(name, url)));
  for (const r of results) {
    const icon = r.ok ? '🟢' : '⚪';
    console.log(`  ${icon} ${r.name.padEnd(26)} -> HTTP ${r.status} (${r.url}) ${r.detail}`);
  }

  console.log('\n======================================================================');
  console.log('💡 COMO SABER SE OS BANCOS ESTÃO CONECTADOS EM EXECUÇÃO:');
  console.log('   - GET /health no tecnicos-service (:8082) mostra: "provider": "MongoDB Atlas" (ou "SQLite" se sem .env)');
  console.log('   - GET /health no os-service (:8081) mostra:       "provider": "Azure SQL Database" (ou "SQLite" se sem .env)');
  console.log('   - GET /api/ordens/mensageria/status mostra:       "connectionConfigured": true/false (Azure Service Bus)');
  console.log('   - GET /api/tecnicos/mensageria/status mostra:     "listening": true/false (Azure Service Bus)');
  console.log('======================================================================\n');
}

main();
