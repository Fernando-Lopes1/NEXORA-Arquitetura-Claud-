export function getTecnicosAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXORA — Gestão da Equipe Técnica (Microsserviço tecnicos-service)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #0b1120; color: #f8fafc; min-height: 100vh; }
    .header { background: #0f172a; border-bottom: 1px solid #1e293b; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-badge { width: 40px; height: 40px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; color: #fff; }
    .brand-title { font-size: 18px; font-weight: 700; color: #fff; }
    .brand-subtitle { font-size: 12px; color: #94a3b8; }
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .chip { padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .chip-green { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .btn-swagger { background: #059669; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: 0.2s; }
    .btn-swagger:hover { background: #047857; }
    
    .container { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .kpi-label { font-size: 12px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #34d399; }
    
    .main-grid { display: grid; grid-template-columns: 360px 1fr; gap: 24px; }
    @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
    
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .card-title { font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    
    .form-group { margin-bottom: 14px; }
    .form-label { display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
    .form-control { width: 100%; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-size: 14px; outline: none; transition: 0.2s; }
    .form-control:focus { border-color: #34d399; box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.2); }
    .btn-submit { width: 100%; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 6px; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 6px; }
    .btn-submit:hover { opacity: 0.95; }
    
    .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { padding: 12px 14px; background: #0f172a; color: #94a3b8; font-weight: 600; border-bottom: 1px solid #334155; }
    td { padding: 14px; border-bottom: 1px solid #1e293b; color: #e2e8f0; vertical-align: middle; }
    tr:hover td { background: rgba(51, 65, 85, 0.3); }
    
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status-Disponivel { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .status-Em_Atendimento { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .status-Ausente { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    
    .spec-badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
    
    .action-btn { background: #334155; color: #f8fafc; border: none; padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.2s; margin-right: 4px; }
    .action-btn:hover { background: #475569; }
    .action-disp { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .action-disp:hover { background: rgba(34, 197, 94, 0.4); }
    .action-atend { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .action-atend:hover { background: rgba(245, 158, 11, 0.4); }
    .action-delete { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .action-delete:hover { background: rgba(239, 68, 68, 0.3); }
    
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; display: none; z-index: 1000; animation: fadeIn 0.3s; }
    .toast-success { background: #065f46; color: #6ee7b7; border: 1px solid #059669; }
    .toast-error { background: #7f1d1d; color: #fca5a5; border: 1px solid #dc2626; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <header class="header">
    <div class="brand">
      <div class="logo-badge">T</div>
      <div>
        <h1 class="brand-title">NEXORA — Gestão da Equipe Técnica</h1>
        <p class="brand-subtitle">Microsserviço tecnicos-service (Database-per-Service)</p>
      </div>
    </div>
    <div class="header-actions">
      <span class="chip chip-green">🟢 API & Banco Conectados</span>
      <a href="/api-docs" class="btn-swagger">📖 Ver Swagger UI</a>
    </div>
  </header>

  <div class="container">
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Total de Técnicos</span>
        <span class="kpi-value" id="kpi-total">0</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Disponíveis</span>
        <span class="kpi-value" id="kpi-disponiveis" style="color: #4ade80;">0</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Em Atendimento</span>
        <span class="kpi-value" id="kpi-atendimento" style="color: #fbbf24;">0</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Ausentes</span>
        <span class="kpi-value" id="kpi-ausentes" style="color: #94a3b8;">0</span>
      </div>
    </div>

    <div class="main-grid">
      <!-- Formulário de Cadastro -->
      <div class="card">
        <h2 class="card-title">👨‍🔧 Novo Técnico de Campo</h2>
        <form id="tecnico-form">
          <div class="form-group">
            <label class="form-label">Nome Completo *</label>
            <input type="text" id="nome" class="form-control" placeholder="Ex: Lucas Gabriel Silveira" required>
          </div>
          <div class="form-group">
            <label class="form-label">Especialidade Principal *</label>
            <select id="especialidade" class="form-control">
              <option value="Climatização">Climatização</option>
              <option value="Refrigeração">Refrigeração</option>
              <option value="Elétrica">Elétrica</option>
              <option value="Mecânica">Mecânica</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Telefone / WhatsApp</label>
            <input type="text" id="telefone" class="form-control" placeholder="(41) 99888-7766">
          </div>
          <div class="form-group">
            <label class="form-label">E-mail Corporativo</label>
            <input type="email" id="email" class="form-control" placeholder="tecnico@nexora.com.br">
          </div>
          <div class="form-group">
            <label class="form-label">Região de Atendimento</label>
            <input type="text" id="regiao_atuacao" class="form-control" placeholder="Ex: Curitiba e Região Metropolitana">
          </div>
          <div class="form-group">
            <label class="form-label">Disponibilidade Inicial</label>
            <select id="status_disponibilidade" class="form-control">
              <option value="Disponível">Disponível</option>
              <option value="Em Atendimento">Em Atendimento</option>
              <option value="Ausente">Ausente</option>
            </select>
          </div>
          <button type="submit" class="btn-submit">Cadastrar Técnico</button>
        </form>
      </div>

      <!-- Tabela de Técnicos -->
      <div class="card">
        <div class="filter-bar">
          <h2 class="card-title" style="margin: 0;">👥 Técnicos Cadastrados</h2>
          <div style="display: flex; gap: 8px;">
            <select id="spec-filter" class="form-control" style="width: 150px;">
              <option value="">Todas Especialidades</option>
              <option value="Climatização">Climatização</option>
              <option value="Refrigeração">Refrigeração</option>
              <option value="Elétrica">Elétrica</option>
              <option value="Mecânica">Mecânica</option>
            </select>
            <select id="status-filter" class="form-control" style="width: 150px;">
              <option value="">Todos Status</option>
              <option value="Disponível">Disponível</option>
              <option value="Em Atendimento">Em Atendimento</option>
              <option value="Ausente">Ausente</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Especialidade</th>
                <th>Contato</th>
                <th>Região</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="tecnicos-tbody">
              <tr><td colspan="7" style="text-align: center; color: #94a3b8;">Carregando técnicos do banco...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    let tecnicosList = [];

    function showToast(msg, isError = false) {
      const toast = document.getElementById('toast');
      toast.className = 'toast ' + (isError ? 'toast-error' : 'toast-success');
      toast.textContent = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3500);
    }

    async function loadTecnicos() {
      const spec = document.getElementById('spec-filter').value;
      const status = document.getElementById('status-filter').value;
      let params = new URLSearchParams();
      if (spec) params.append('especialidade', spec);
      if (status) params.append('status', status);

      const url = '/api/tecnicos' + (params.toString() ? '?' + params.toString() : '');
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Falha ao buscar técnicos');
        tecnicosList = await res.json();
        renderTecnicos();
        updateKpis();
      } catch (err) {
        showToast('Erro ao carregar dados do banco de dados.', true);
      }
    }

    function updateKpis() {
      document.getElementById('kpi-total').textContent = tecnicosList.length;
      document.getElementById('kpi-disponiveis').textContent = tecnicosList.filter(t => t.status_disponibilidade === 'Disponível').length;
      document.getElementById('kpi-atendimento').textContent = tecnicosList.filter(t => t.status_disponibilidade === 'Em Atendimento').length;
      document.getElementById('kpi-ausentes').textContent = tecnicosList.filter(t => t.status_disponibilidade === 'Ausente').length;
    }

    function renderTecnicos() {
      const tbody = document.getElementById('tecnicos-tbody');
      if (tecnicosList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">Nenhum técnico encontrado.</td></tr>';
        return;
      }

      tbody.innerHTML = tecnicosList.map(t => {
        const statusClass = 'status-' + t.status_disponibilidade.replace(/\\s+/g, '_');
        return \`
          <tr>
            <td><strong>#\${t.id}</strong></td>
            <td><strong>\${escapeHtml(t.nome)}</strong></td>
            <td><span class="spec-badge">\${t.especialidade}</span></td>
            <td>\${escapeHtml(t.telefone || t.email || 'Não informado')}</td>
            <td>\${escapeHtml(t.regiao_atuacao || 'Todas')}</td>
            <td><span class="status-badge \${statusClass}">\${t.status_disponibilidade}</span></td>
            <td>
              \${t.status_disponibilidade !== 'Disponível' ? \`<button class="action-btn action-disp" onclick="updateDisponibilidade(\${t.id}, 'Disponível')">Livre</button>\` : ''}
              \${t.status_disponibilidade !== 'Em Atendimento' ? \`<button class="action-btn action-atend" onclick="updateDisponibilidade(\${t.id}, 'Em Atendimento')">Em Campo</button>\` : ''}
              \${t.status_disponibilidade !== 'Ausente' ? \`<button class="action-btn" onclick="updateDisponibilidade(\${t.id}, 'Ausente')">Ausente</button>\` : ''}
              <button class="action-btn action-delete" onclick="deleteTecnico(\${t.id})">Excluir</button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function escapeHtml(text) {
      if (!text) return '';
      return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
    }

    async function updateDisponibilidade(id, status) {
      try {
        const res = await fetch('/api/tecnicos/' + id + '/disponibilidade', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status_disponibilidade: status })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao alterar status');
        showToast('Disponibilidade do técnico #' + id + ' alterada para ' + status + '!');
        loadTecnicos();
      } catch (err) {
        showToast(err.message, true);
      }
    }

    async function deleteTecnico(id) {
      if (!confirm('Deseja excluir permanentemente o técnico #' + id + '?')) return;
      try {
        const res = await fetch('/api/tecnicos/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao excluir');
        showToast('Técnico #' + id + ' excluído com sucesso!');
        loadTecnicos();
      } catch (err) {
        showToast(err.message, true);
      }
    }

    document.getElementById('tecnico-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        nome: document.getElementById('nome').value.trim(),
        especialidade: document.getElementById('especialidade').value,
        telefone: document.getElementById('telefone').value.trim() || undefined,
        email: document.getElementById('email').value.trim() || undefined,
        regiao_atuacao: document.getElementById('regiao_atuacao').value.trim() || undefined,
        status_disponibilidade: document.getElementById('status_disponibilidade').value
      };

      try {
        const res = await fetch('/api/tecnicos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao cadastrar técnico');
        showToast('Técnico #' + data.id + ' cadastrado com sucesso!');
        document.getElementById('tecnico-form').reset();
        loadTecnicos();
      } catch (err) {
        showToast(err.message, true);
      }
    });

    document.getElementById('spec-filter').addEventListener('change', loadTecnicos);
    document.getElementById('status-filter').addEventListener('change', loadTecnicos);
    loadTecnicos();
  </script>
</body>
</html>`;
}
