import React, { useState, Suspense } from 'react';

// Importações dinâmicas dos 3 Micro-Frontends Remotos totalmente desacoplados
const RemoteOrderForm = React.lazy(() => import('remote/OrderForm'));
const RemoteOrderList = React.lazy(() => import('remoteList/OrderList'));
const RemoteDashboard = React.lazy(() => import('remoteDashboard/Dashboard'));

// Componente Error Boundary para resiliência caso algum Remote esteja indisponível
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro ao carregar MFE Remoto:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorContainer}>
          <h3 style={styles.errorTitle}>⚠️ Erro ao carregar Micro-Frontend Remoto</h3>
          <p style={styles.errorDesc}>
            Não foi possível conectar ao serviço remoto. Verifique se as instâncias do Azure estão ativas.
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
  // Estado centralizado de Ordens de Serviço no Host Shell
  const [orders, setOrders] = useState([
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

  // Controle da aba ativa no Host Container
  const [activeTab, setActiveTab] = useState('dashboard');

  // Callback para receber novas OS criadas no MFE Remote 1 (OrderForm)
  const handleAddOrder = (newOrder) => {
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
  };

  // Concluir ordem de serviço
  const handleCompleteOrder = (id) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === id ? { ...ord, situacao: 'Concluída' } : ord
      )
    );
  };

  // Excluir ordem de serviço
  const handleDeleteOrder = (id) => {
    if (window.confirm(`Deseja realmente remover a Ordem de Serviço ${id}?`)) {
      setOrders((prev) => prev.filter((ord) => ord.id !== id));
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
            <p style={styles.brandSubtitle}>ERP & Field Service Management</p>
          </div>
        </div>

        <div style={styles.navGroupInfo}>
          <span style={styles.mfeTag}>Host Shell (Porta 3000)</span>
          <span style={styles.groupBadge}>Atividade Formativa 13</span>
        </div>
      </header>

      {/* Menu de Navegação por Módulos (Host shell loading 3 independent remotes) */}
      <div style={styles.navigationBar}>
        <div style={styles.navInner}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...styles.navTab,
              ...(activeTab === 'dashboard' ? styles.activeNavTab : {}),
            }}
          >
            📊 MFE 3: Dashboard & Analytics (Azure Link 4)
          </button>
          <button
            onClick={() => setActiveTab('form')}
            style={{
              ...styles.navTab,
              ...(activeTab === 'form' ? styles.activeNavTab : {}),
            }}
          >
            ⚡ MFE 1: Abertura de OS (Azure Link 2)
          </button>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              ...styles.navTab,
              ...(activeTab === 'list' ? styles.activeNavTab : {}),
            }}
          >
            📋 MFE 2: Gestão & Tabela de OS (Azure Link 3)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {activeTab === 'dashboard' && (
          <section style={styles.section}>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div style={styles.loadingBox}>
                    <div style={styles.spinner}></div>
                    <span>Carregando MFE 3 Remoto (remoteDashboard/Dashboard)...</span>
                  </div>
                }
              >
                <RemoteDashboard orders={orders} />
              </Suspense>
            </ErrorBoundary>
          </section>
        )}

        {activeTab === 'form' && (
          <section style={styles.section}>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div style={styles.loadingBox}>
                    <div style={styles.spinner}></div>
                    <span>Carregando MFE 1 Remoto (remote/OrderForm)...</span>
                  </div>
                }
              >
                <RemoteOrderForm onAddOrder={handleAddOrder} />
              </Suspense>
            </ErrorBoundary>
          </section>
        )}

        {activeTab === 'list' && (
          <section style={styles.section}>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div style={styles.loadingBox}>
                    <div style={styles.spinner}></div>
                    <span>Carregando MFE 2 Remoto (remoteList/OrderList)...</span>
                  </div>
                }
              >
                <RemoteOrderList
                  orders={orders}
                  onCompleteOrder={handleCompleteOrder}
                  onDeleteOrder={handleDeleteOrder}
                />
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
  navigationBar: {
    backgroundColor: '#041B44',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '0 32px',
  },
  navInner: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    gap: '8px',
  },
  navTab: {
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeNavTab: {
    color: '#FFFFFF',
    borderBottomColor: '#0B5FD7',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
