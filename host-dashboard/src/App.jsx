import React, { useState, Suspense } from 'react';

// Importação dinâmica do Remote 2 (Dashboard MFE e RemoteApp) via Webpack Module Federation
const RemoteDashboard = React.lazy(() => import('remoteDashboard/Dashboard'));
const RemoteDashboardStandaloneApp = React.lazy(() => import('remoteDashboard/RemoteApp'));

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

  // Estado para alternar entre visão Host e visão Remote no mesmo link
  const [activeTab, setActiveTab] = useState('host'); // 'host' | 'remote'

  return (
    <div style={styles.appContainer}>
      {/* Top Navbar NEXORA */}
      <header style={styles.navbar}>
        <div style={styles.navBrandContainer}>
          <div style={styles.logoBadge}>N</div>
          <div>
            <h1 style={styles.brandTitle}>NEXORA</h1>
            <p style={styles.brandSubtitle}>Dashboard & Business Intelligence (Funcionalidade 2)</p>
          </div>
        </div>

        <div style={styles.navGroupInfo}>
          <span style={styles.mfeTag}>Funcionalidade 2 (Link Unificado)</span>
          <span style={styles.groupBadge}>Atividade Formativa 13</span>
        </div>
      </header>

      {/* Barra de Abas: Alternância entre Host e Remote no mesmo Link */}
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
              🏢 Visão Host (Shell Executivo via MFE)
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
            🔗 <strong>Link Único:</strong> Host & Remote unificados nesta URL
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {activeTab === 'remote' ? (
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
              Projeto de Micro-Frontends com React 18 & Webpack 5 Module Federation
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
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  navbar: {
    backgroundColor: '#06265F',
    color: '#FFFFFF',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 10px rgba(6, 38, 95, 0.15)',
  },
  tabNavContainer: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '12px 32px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  tabNavWrapper: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tabButtons: {
    display: 'flex',
    gap: '10px',
  },
  tabBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
  },
  tabBtnActive: {
    backgroundColor: '#0B5FD7',
    color: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(11, 95, 215, 0.25)',
  },
  tabBtnInactive: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },
  unificationBadge: {
    fontSize: '12px',
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid #BAE6FD',
  },
  remoteWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 12px rgba(6, 38, 95, 0.05)',
  },
  remoteBanner: {
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    padding: '14px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
    border: '1px solid #BFDBFE',
  },
  navBrandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoBadge: {
    backgroundColor: '#0B5FD7',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: '22px',
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(11, 95, 215, 0.3)',
  },
  brandTitle: {
    fontSize: '22px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '1px',
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
  mfeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#CBD5E1',
    fontSize: '12px',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  groupBadge: {
    backgroundColor: '#0B5FD7',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: '6px',
  },
  mainContent: {
    flex: 1,
    maxWidth: '1240px',
    width: '100%',
    margin: '0 auto',
    padding: '32px 24px',
  },
  section: {
    marginBottom: '24px',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: '12px',
    padding: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#475569',
    fontWeight: '500',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid #CBD5E1',
    borderTop: '3px solid #0B5FD7',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: '12px',
    padding: '24px',
    color: '#991B1B',
  },
  errorTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '700',
  },
  errorDesc: {
    margin: '0 0 16px 0',
    fontSize: '14px',
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  footer: {
    backgroundColor: '#06265F',
    color: '#94A3B8',
    padding: '24px 32px',
    marginTop: 'auto',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  footerContent: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  footerHeading: {
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  footerSubText: {
    fontSize: '12px',
    margin: 0,
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  membersTitle: {
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
  },
  memberNames: {
    fontSize: '13px',
    color: '#CBD5E1',
  },
};

export default App;
