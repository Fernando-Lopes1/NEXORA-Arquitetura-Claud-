import React, { useState, useEffect, Suspense } from 'react';

// Importação dinâmica do Remote 2 (Dashboard MFE e RemoteApp) via Webpack Module Federation
const RemoteDashboard = React.lazy(() => import('remoteDashboard/Dashboard'));
const RemoteDashboardStandaloneApp = React.lazy(() => import('remoteDashboard/RemoteApp'));

const API_TECNICOS_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8082'
  : 'https://nexora-remote-dashboard-fernando.azurewebsites.net';

// Componente Error Boundary para resiliência caso o Remote 2 esteja indisponível
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro ao carregar o MFE Remote 2 (Dashboard):', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorContainer}>
          <h3 style={styles.errorTitle}>⚠️ Erro ao carregar o Micro-Frontend Remoto (Dashboard)</h3>
          <p style={styles.errorDesc}>
            Não foi possível conectar ao MFE Remote 2 (Dashboard). Verifique se a aplicação remota está em execução no Azure.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={styles.retryBtn}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  // Dados operacionais para visualização executiva no Host 2
  const [orders] = useState([
    {
      id: 'OS-1001',
      cliente: 'Hospital Central São Lucas',
      servico: 'Manutenção preventiva em gerador principal',
      tecnico: 'Henrique Ricardo',
      prioridade: 'Alta',
      situacao: 'Em execução',
      valorEstimado: '1850.00',
      dataCriacao: '02/10/2026',
    },
    {
      id: 'OS-1002',
      cliente: 'Logística TransBrasil S.A.',
      servico: 'Instalação de rastreadores em frota de caminhões',
      tecnico: 'Felipe Carneiro',
      prioridade: 'Média',
      situacao: 'Agendada',
      valorEstimado: '920.00',
      dataCriacao: '02/10/2026',
    },
    {
      id: 'OS-1003',
      cliente: 'Escola Técnica Politécnica',
      servico: 'Substituição de switch de rede principal',
      tecnico: 'Não atribuído',
      prioridade: 'Baixa',
      situacao: 'Aberta',
      valorEstimado: '450.00',
      dataCriacao: '01/10/2026',
    },
  ]);

  // Estado para alternar entre visão Host, CRUD Técnicos e visão Remote
  const [activeTab, setActiveTab] = useState('host'); // 'host' | 'tecnicos' | 'remote'
  const [backendOnline, setBackendOnline] = useState(false);

  // Estado da lista de técnicos de campo
  const [tecnicos, setTecnicos] = useState([
    { id: 1, nome: 'Henrique Ricardo', especialidade: 'Climatização', telefone: '(41) 98888-1111', email: 'henrique@nexora.com.br', regiao_atuacao: 'Curitiba Centro', status_disponibilidade: 'Em Atendimento' },
    { id: 2, nome: 'Felipe Carneiro', especialidade: 'Refrigeração', telefone: '(41) 98888-2222', email: 'felipe@nexora.com.br', regiao_atuacao: 'Zona Sul', status_disponibilidade: 'Disponível' },
    { id: 3, nome: 'Éden Samuel', especialidade: 'Elétrica', telefone: '(41) 98888-3333', email: 'eden@nexora.com.br', regiao_atuacao: 'Zona Norte', status_disponibilidade: 'Disponível' },
  ]);

  // Estado do formulário de novo técnico
  const [formTecnico, setFormTecnico] = useState({
    nome: '',
    especialidade: 'Climatização',
    telefone: '',
    email: '',
    regiao_atuacao: '',
    status_disponibilidade: 'Disponível',
  });

  const fetchTecnicos = async () => {
    try {
      const res = await fetch(`${API_TECNICOS_URL}/api/tecnicos`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTecnicos(data);
        }
        setBackendOnline(true);
      }
    } catch (e) {
      console.log('tecnicos-service offline, usando dados locais');
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    fetchTecnicos();
  }, []);

  const handleAddTecnico = async (e) => {
    e.preventDefault();
    if (!formTecnico.nome.trim()) return alert('Informe o nome do técnico');

    try {
      const res = await fetch(`${API_TECNICOS_URL}/api/tecnicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formTecnico),
      });
      if (res.ok) {
        const created = await res.json();
        setTecnicos((prev) => [created, ...prev]);
        setFormTecnico({
          nome: '',
          especialidade: 'Climatização',
          telefone: '',
          email: '',
          regiao_atuacao: '',
          status_disponibilidade: 'Disponível',
        });
        alert('Técnico cadastrado com sucesso no banco de dados!');
      }
    } catch (err) {
      // Fallback local
      const localCreated = { id: Date.now(), ...formTecnico };
      setTecnicos((prev) => [localCreated, ...prev]);
      alert('Técnico salvo localmente!');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await fetch(`${API_TECNICOS_URL}/api/tecnicos/${id}/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_disponibilidade: status }),
      });
      setTecnicos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status_disponibilidade: status } : t))
      );
    } catch (err) {
      setTecnicos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status_disponibilidade: status } : t))
      );
    }
  };

  const handleDeleteTecnico = async (id) => {
    if (!window.confirm('Deseja excluir este técnico?')) return;
    try {
      await fetch(`${API_TECNICOS_URL}/api/tecnicos/${id}`, { method: 'DELETE' });
      setTecnicos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setTecnicos((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* Top Navbar NEXORA */}
      <header style={styles.navbar}>
        <div style={styles.navBrandContainer}>
          <div style={styles.logoBadge}>N</div>
          <div>
            <h1 style={styles.brandTitle}>NEXORA</h1>
            <p style={styles.brandSubtitle}>Dashboard BI & Gestão de Técnicos (Funcionalidade 2)</p>
          </div>
        </div>

        <div style={styles.navGroupInfo}>
          <span style={{
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: backendOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: backendOnline ? '#10b981' : '#ef4444',
            border: backendOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {backendOnline ? '🟢 tecnicos-service :8082 Conectado' : '🟠 Modo Fallback Local'}
          </span>
          <a
            href="https://nexora-remote-dashboard-fernando.azurewebsites.net/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              backgroundColor: '#059669',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📖 Swagger API (:8082)
          </a>
        </div>
      </header>

      {/* Barra de Abas */}
      <div style={styles.tabNavContainer}>
        <div style={styles.tabNavWrapper}>
          <div style={styles.tabButtons}>
            <button
              onClick={() => setActiveTab('host')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'host' ? styles.tabBtnActive : styles.tabBtnInactive),
              }}
            >
              🏢 Visão Host (Dashboard BI)
            </button>
            <button
              onClick={() => setActiveTab('tecnicos')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'tecnicos' ? styles.tabBtnActive : styles.tabBtnInactive),
              }}
            >
              👥 Gestão de Técnicos (CRUD :8082)
            </button>
            <button
              onClick={() => setActiveTab('remote')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'remote' ? styles.tabBtnActive : styles.tabBtnInactive),
              }}
            >
              ⚡ Visão Remote (MFE Standalone)
            </button>
          </div>
          <div style={styles.unificationBadge}>
            🔗 <strong>Link Único:</strong> Dashboard BI + CRUD de Técnicos Integrados
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {activeTab === 'tecnicos' ? (
          /* Aba CRUD de Técnicos de Campo */
          <section style={styles.section}>
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
              {/* Form Cadastro de Técnico */}
              <div style={styles.crudCard}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#0f172a' }}>
                  👨‍🔧 Cadastrar Novo Técnico
                </h3>
                <form onSubmit={handleAddTecnico}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={styles.formLabel}>Nome Completo *</label>
                    <input
                      type="text"
                      style={styles.formInput}
                      value={formTecnico.nome}
                      onChange={(e) => setFormTecnico({ ...formTecnico, nome: e.target.value })}
                      placeholder="Ex: Tarcísio Bento"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={styles.formLabel}>Especialidade *</label>
                    <select
                      style={styles.formInput}
                      value={formTecnico.especialidade}
                      onChange={(e) => setFormTecnico({ ...formTecnico, especialidade: e.target.value })}
                    >
                      <option value="Climatização">Climatização</option>
                      <option value="Refrigeração">Refrigeração</option>
                      <option value="Elétrica">Elétrica</option>
                      <option value="Mecânica">Mecânica</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={styles.formLabel}>Telefone</label>
                    <input
                      type="text"
                      style={styles.formInput}
                      value={formTecnico.telefone}
                      onChange={(e) => setFormTecnico({ ...formTecnico, telefone: e.target.value })}
                      placeholder="(41) 99999-8888"
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={styles.formLabel}>E-mail</label>
                    <input
                      type="email"
                      style={styles.formInput}
                      value={formTecnico.email}
                      onChange={(e) => setFormTecnico({ ...formTecnico, email: e.target.value })}
                      placeholder="tecnico@nexora.com.br"
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={styles.formLabel}>Região</label>
                    <input
                      type="text"
                      style={styles.formInput}
                      value={formTecnico.regiao_atuacao}
                      onChange={(e) => setFormTecnico({ ...formTecnico, regiao_atuacao: e.target.value })}
                      placeholder="Ex: Curitiba e Região"
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={styles.formLabel}>Disponibilidade Inicial</label>
                    <select
                      style={styles.formInput}
                      value={formTecnico.status_disponibilidade}
                      onChange={(e) => setFormTecnico({ ...formTecnico, status_disponibilidade: e.target.value })}
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Em Atendimento">Em Atendimento</option>
                      <option value="Ausente">Ausente</option>
                    </select>
                  </div>
                  <button type="submit" style={styles.submitBtn}>
                    Salvar Técnico no Banco
                  </button>
                </form>
              </div>

              {/* Tabela de Técnicos */}
              <div style={styles.crudCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                    👥 Equipe Técnica ({tecnicos.length} profissionais)
                  </h3>
                  <button onClick={fetchTecnicos} style={styles.refreshBtn}>
                    🔄 Atualizar Lista
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '10px 8px' }}>Nome</th>
                        <th style={{ padding: '10px 8px' }}>Especialidade</th>
                        <th style={{ padding: '10px 8px' }}>Região</th>
                        <th style={{ padding: '10px 8px' }}>Disponibilidade</th>
                        <th style={{ padding: '10px 8px' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tecnicos.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 8px', fontWeight: '600' }}>{t.nome}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={styles.specBadge}>{t.especialidade}</span>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#64748b' }}>{t.regiao_atuacao || 'Todas'}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor:
                                  t.status_disponibilidade === 'Disponível'
                                    ? '#dcfce7'
                                    : t.status_disponibilidade === 'Em Atendimento'
                                    ? '#fef3c7'
                                    : '#f1f5f9',
                                color:
                                  t.status_disponibilidade === 'Disponível'
                                    ? '#15803d'
                                    : t.status_disponibilidade === 'Em Atendimento'
                                    ? '#b45309'
                                    : '#475569',
                              }}
                            >
                              {t.status_disponibilidade}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            {t.status_disponibilidade !== 'Disponível' && (
                              <button
                                onClick={() => handleUpdateStatus(t.id, 'Disponível')}
                                style={styles.actionBtnDisp}
                              >
                                Livre
                              </button>
                            )}
                            {t.status_disponibilidade !== 'Em Atendimento' && (
                              <button
                                onClick={() => handleUpdateStatus(t.id, 'Em Atendimento')}
                                style={styles.actionBtnAtend}
                              >
                                Campo
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTecnico(t.id)}
                              style={styles.actionBtnDel}
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        ) : activeTab === 'remote' ? (
          /* Visão Remota Autônoma (Standalone) */
          <section style={styles.section}>
            <div style={styles.remoteWrapperCard}>
              <div style={styles.remoteBanner}>
                <span>
                  ⚡ <strong>Modo Remote Standalone:</strong> Visualizando o Micro-Frontend Remoto 2 (Dashboard) isolado, carregado dinamicamente via Webpack Module Federation dentro do mesmo domínio.
                </span>
              </div>
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div style={styles.loadingBox}>
                      <div style={styles.spinner}></div>
                      <span>Carregando Remote 2 Standalone...</span>
                    </div>
                  }
                >
                  <RemoteDashboardStandaloneApp />
                </Suspense>
              </ErrorBoundary>
            </div>
          </section>
        ) : (
          /* Visão Host Integrada */
          <section style={styles.section}>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div style={styles.loadingBox}>
                    <div style={styles.spinner}></div>
                    <span>Carregando MFE 2 Remoto (remoteDashboard/Dashboard)...</span>
                  </div>
                }
              >
                <RemoteDashboard orders={orders} />
              </Suspense>
            </ErrorBoundary>
          </section>
        )}
      </main>

      {/* Rodapé do ERP NEXORA */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div>
            <h4 style={styles.footerHeading}>NEXORA (Arquitetura Claud)</h4>
            <p style={styles.footerSubText}>
              Projeto de Microsserviços e Micro-Frontends com React 18 & Webpack 5
            </p>
          </div>
          <div style={styles.membersList}>
            <span style={styles.membersTitle}>Integrantes do Grupo:</span>
            <div style={styles.memberNames}>
              <span>Éden Samuel</span> • <span>Fernando Lopes</span> • <span>Felipe Carneiro</span> •{' '}
              <span>Henrique Ricardo</span> • <span>Hugo Takeda</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderBottom: '3px solid #10B981',
    flexWrap: 'wrap',
    gap: '16px',
  },
  navBrandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    backgroundColor: '#10B981',
    color: '#0F172A',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '18px',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    margin: 0,
  },
  brandSubtitle: {
    fontSize: '12px',
    color: '#94A3B8',
    margin: 0,
  },
  navGroupInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tabNavContainer: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '12px 32px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  tabNavWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tabButtons: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
  },
  tabBtnInactive: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },
  unificationBadge: {
    fontSize: '12px',
    color: '#475569',
    backgroundColor: '#F8FAFC',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
  },
  mainContent: {
    flex: 1,
    padding: '24px 32px',
  },
  section: {
    maxWidth: '1280px',
    margin: '0 auto',
  },
  crudCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '4px',
  },
  formInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },
  refreshBtn: {
    padding: '4px 8px',
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  specBadge: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  actionBtnDisp: {
    padding: '3px 6px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    marginRight: '4px',
  },
  actionBtnAtend: {
    padding: '3px 6px',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    marginRight: '4px',
  },
  actionBtnDel: {
    padding: '3px 6px',
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  remoteWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
  },
  remoteBanner: {
    backgroundColor: '#0F172A',
    color: '#38BDF8',
    padding: '10px 16px',
    fontSize: '12px',
    borderBottom: '1px solid #1E293B',
  },
  loadingBox: {
    padding: '48px',
    textAlign: 'center',
    color: '#64748B',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #E2E8F0',
    borderTopColor: '#10B981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  footer: {
    backgroundColor: '#0F172A',
    color: '#94A3B8',
    padding: '20px 32px',
    borderTop: '1px solid #1E293B',
    fontSize: '12px',
  },
  footerContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  footerHeading: {
    color: '#F8FAFC',
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
  },
  footerSubText: {
    margin: 0,
    color: '#64748B',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  membersTitle: {
    fontWeight: '600',
    color: '#CBD5E1',
  },
  memberNames: {
    color: '#94A3B8',
  },
};

export default App;
