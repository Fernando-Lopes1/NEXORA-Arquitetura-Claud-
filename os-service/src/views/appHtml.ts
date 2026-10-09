export function getOsAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXORA — Gestão de Ordens de Serviço (Microsserviço os-service)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #0b1120; color: #f8fafc; min-height: 100vh; }
    .header { background: #0f172a; border-bottom: 1px solid #1e293b; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-badge { width: 40px; height: 40px; background: linear-gradient(135deg, #06b6d4, #0284c7); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; color: #fff; }
    .brand-title { font-size: 18px; font-weight: 700; color: #fff; }
    .brand-subtitle { font-size: 12px; color: #94a3b8; }
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .chip { padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .chip-green { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .btn-swagger { background: #0284c7; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: 0.2s; }
    .btn-swagger:hover { background: #0369a1; }
    
    .container { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .kpi-label { font-size: 12px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #38bdf8; }
    
    .main-grid { display: grid; grid-template-columns: 360px 1fr; gap: 24px; }
    @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
    
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .card-title { font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    
    .form-group { margin-bottom: 14px; }
    .form-label { display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
    .form-control { width: 100%; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-size: 14px; outline: none; transition: 0.2s; }
    .form-control:focus { border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }
    textarea.form-control { resize: vertical; min-height: 70px; }
    .btn-submit { width: 100%; padding: 12px; background: linear-gradient(135deg, #06b6d4, #0284c7); border: none; border-radius: 6px; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 6px; }
    .btn-submit:hover { opacity: 0.95; }
    
    .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { padding: 12px 14px; background: #0f172a; color: #94a3b8; font-weight: 600; border-bottom: 1px solid #334155; }
    td { padding: 14px; border-bottom: 1px solid #1e293b; color: #e2e8f0; vertical-align: middle; }
    tr:hover td { background: rgba(51, 65, 85, 0.3); }
    
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status-Aberta { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .status-Agendada { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .status-Em_Execucao { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .status-Concluida { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .status-Cancelada { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    
    .prio-badge { padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .prio-Baixa { background: #334155; color: #cbd5e1; }
    .prio-Media { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .prio-Alta { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
    .prio-Urgente { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    
    .action-btn { background: #334155; color: #f8fafc; border: none; padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.2s; margin-right: 4px; }
    .action-btn:hover { background: #475569; }
    .action-advance { background: rgba(6, 182, 212, 0.2); color: #22d3ee; }
    .action-advance:hover { background: rgba(6, 182, 212, 0.4); }
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
      <div class="logo-badge">N</div>
      <div>
        <h1 class="brand-title">NEXORA — Gestão de Ordens de Serviço</h1>
        <p class="brand-subtitle">Microsserviço os-service (Database-per-Service)</p>
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
        <span class="kpi-label">Total de OS</span>
        <span class="kpi-value" id="kpi-total">0</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Abertas / Agendadas</span>
        <span class="kpi-value" id="kpi-abertas">0</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Em Execução</span>
        <span class="kpi-value" id="kpi-execucao">0</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Concluídas</span>
        <span class="kpi-value" id="kpi-concluidas">0</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Volume Total</span>
        <span class="kpi-value" id="kpi-valor">R$ 0,00</span>
      </div>
    </div>

    <div class="main-grid">
      <!-- Formulário de Cadastro -->
      <div class="card">
        <h2 class="card-title">📝 Nova Ordem de Serviço</h2>
        <form id="order-form">
          <div class="form-group">
            <label class="form-label">Cliente / Razão Social *</label>
            <input type="text" id="cliente" class="form-control" placeholder="Ex: Hospital Samaritano" required>
          </div>
          <div class="form-group">
            <label class="form-label">Descrição do Atendimento *</label>
            <textarea id="descricao_servico" class="form-control" placeholder="Descreva os serviços ou reparos necessários..." required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Técnico Responsável</label>
            <input type="text" id="tecnico" class="form-control" placeholder="Ex: Henrique Ricardo (Obrigatório para Agendada)">
          </div>
          <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label class="form-label">Prioridade</label>
              <select id="prioridade" class="form-control">
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label class="form-label">Status Inicial</label>
              <select id="status" class="form-control">
                <option value="Aberta">Aberta</option>
                <option value="Agendada">Agendada</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Valor Estimado (R$)</label>
            <input type="number" step="0.01" id="valor_estimado" class="form-control" placeholder="0.00" value="0.00">
          </div>
          <button type="submit" class="btn-submit">Criar Ordem de Serviço</button>
        </form>
      </div>

      <!-- Tabela de Ordens -->
      <div class="card">
        <div class="filter-bar">
          <h2 class="card-title" style="margin: 0;">📋 Ordens de Serviço Cadastradas</h2>
          <div>
            <select id="status-filter" class="form-control" style="width: 160px; display: inline-block;">
              <option value="">Todos os Status</option>
              <option value="Aberta">Aberta</option>
              <option value="Agendada">Agendada</option>
              <option value="Em Execução">Em Execução</option>
              <option value="Concluída">Concluída</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Técnico</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="orders-tbody">
              <tr><td colspan="8" style="text-align: center; color: #94a3b8;">Carregando ordens do banco...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    let ordersList = [];

    function showToast(msg, isError = false) {
      const toast = document.getElementById('toast');
      toast.className = 'toast ' + (isError ? 'toast-error' : 'toast-success');
      toast.textContent = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3500);
    }

    async function loadOrders() {
      const filter = document.getElementById('status-filter').value;
      const url = filter ? '/api/ordens?status=' + encodeURIComponent(filter) : '/api/ordens';
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Falha ao buscar ordens');
        ordersList = await res.json();
        renderOrders();
        updateKpis();
      } catch (err) {
        showToast('Erro ao carregar dados do banco de dados.', true);
      }
    }

    function updateKpis() {
      document.getElementById('kpi-total').textContent = ordersList.length;
      document.getElementById('kpi-abertas').textContent = ordersList.filter(o => o.status === 'Aberta' || o.status === 'Agendada').length;
      document.getElementById('kpi-execucao').textContent = ordersList.filter(o => o.status === 'Em Execução').length;
      document.getElementById('kpi-concluidas').textContent = ordersList.filter(o => o.status === 'Concluída').length;
      const totalValor = ordersList.reduce((acc, o) => acc + (Number(o.valor_estimado) || 0), 0);
      document.getElementById('kpi-valor').textContent = 'R$ ' + totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }

    function renderOrders() {
      const tbody = document.getElementById('orders-tbody');
      if (ordersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 24px;">Nenhuma ordem encontrada.</td></tr>';
        return;
      }

      tbody.innerHTML = ordersList.map(o => {
        const statusClass = 'status-' + o.status.replace(/\\s+/g, '_');
        const prioClass = 'prio-' + o.prioridade;
        
        let nextStatus = '';
        let nextBtnLabel = '';
        if (o.status === 'Aberta') { nextStatus = 'Agendada'; nextBtnLabel = 'Agendar'; }
        else if (o.status === 'Agendada') { nextStatus = 'Em Execução'; nextBtnLabel = 'Executar'; }
        else if (o.status === 'Em Execução') { nextStatus = 'Concluída'; nextBtnLabel = 'Concluir'; }

        return \`
          <tr>
            <td><strong>#\${o.id}</strong></td>
            <td><strong>\${escapeHtml(o.cliente)}</strong></td>
            <td>\${escapeHtml(o.descricao_servico)}</td>
            <td>\${escapeHtml(o.tecnico || 'Não atribuído')}</td>
            <td><span class="prio-badge \${prioClass}">\${o.prioridade}</span></td>
            <td><span class="status-badge \${statusClass}">\${o.status}</span></td>
            <td>R$ \${Number(o.valor_estimado || 0).toFixed(2)}</td>
            <td>
              \${nextStatus ? \`<button class="action-btn action-advance" onclick="advanceStatus(\${o.id}, '\${nextStatus}', '\${escapeHtml(o.tecnico || '')}')">\${nextBtnLabel}</button>\` : ''}
              \${o.status !== 'Concluída' && o.status !== 'Cancelada' ? \`<button class="action-btn" onclick="cancelOrder(\${o.id})">Cancelar</button>\` : ''}
              <button class="action-btn action-delete" onclick="deleteOrder(\${o.id})">Excluir</button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function escapeHtml(text) {
      if (!text) return '';
      return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
    }

    async function advanceStatus(id, newStatus, currentTecnico) {
      let payload = { status: newStatus };
      if (newStatus === 'Agendada' && (!currentTecnico || currentTecnico === 'Não atribuído')) {
        const tecnico = prompt('Informe o nome do técnico responsável para agendar:');
        if (!tecnico || !tecnico.trim()) {
          showToast('Técnico é obrigatório para agendar a OS.', true);
          return;
        }
        payload.tecnico = tecnico.trim();
      }

      try {
        const res = await fetch('/api/ordens/' + id + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao alterar status');
        showToast('Ordem #' + id + ' avançada para ' + newStatus + '!');
        loadOrders();
      } catch (err) {
        showToast(err.message, true);
      }
    }

    async function cancelOrder(id) {
      if (!confirm('Deseja realmente cancelar a OS #' + id + '?')) return;
      try {
        const res = await fetch('/api/ordens/' + id + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Cancelada' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao cancelar');
        showToast('Ordem #' + id + ' cancelada!');
        loadOrders();
      } catch (err) {
        showToast(err.message, true);
      }
    }

    async function deleteOrder(id) {
      if (!confirm('Deseja excluir permanentemente a OS #' + id + '?')) return;
      try {
        const res = await fetch('/api/ordens/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao excluir');
        showToast('Ordem #' + id + ' excluída com sucesso!');
        loadOrders();
      } catch (err) {
        showToast(err.message, true);
      }
    }

    document.getElementById('order-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        cliente: document.getElementById('cliente').value.trim(),
        descricao_servico: document.getElementById('descricao_servico').value.trim(),
        tecnico: document.getElementById('tecnico').value.trim() || undefined,
        prioridade: document.getElementById('prioridade').value,
        status: document.getElementById('status').value,
        valor_estimado: parseFloat(document.getElementById('valor_estimado').value) || 0
      };

      try {
        const res = await fetch('/api/ordens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao criar ordem');
        showToast('Ordem #' + data.id + ' criada com sucesso!');
        document.getElementById('order-form').reset();
        document.getElementById('valor_estimado').value = '0.00';
        loadOrders();
      } catch (err) {
        showToast(err.message, true);
      }
    });

    document.getElementById('status-filter').addEventListener('change', loadOrders);
    loadOrders();
  </script>
</body>
</html>`;
}
