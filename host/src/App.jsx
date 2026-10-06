import React, { useState, Suspense } from 'react';

// Importação dinâmica do Remote 1 (OrderForm) via Webpack Module Federation
const RemoteOrderForm = React.lazy(() => import('remote/OrderForm'));

// Componente Error Boundary para resiliência caso o Remote esteja indisponível
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro ao carregar MFE Remote:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorContainer}>
          <h3 style={styles.errorTitle}>⚠️ Erro ao carregar Micro-Frontend Remoto</h3>
          <p style={styles.errorDesc}>
            Não foi possível conectar ao MFE Remote (porta 3001). Verifique se a aplicação remota está em execução.
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
  // Estado centralizado de Ordens de Serviço no Host Shell 1
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

  // Badges coloridos por status
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Aberta':
        return { backgroundColor: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' };
      case 'Agendada':
        return { backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' };
      case 'Em execução':
        return { backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' };
      case 'Concluída':
        return { backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' };
      case 'Cancelada':
        return { backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' };
    }
  };

  // Badges coloridos por prioridade
  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case 'Baixa':
        return { backgroundColor: '#F1F5F9', color: '#475569' };
      case 'Média':
        return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
      case 'Alta':
        return { backgroundColor: '#FFEDD5', color: '#C2410C' };
      case 'Urgente':
        return { backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: '700' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569' };
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
            <p style={styles.brandSubtitle}>Gestão de Serviços de Campo (Par 1 - OS)</p>
          </div>
        </div>

        <div style={styles.navGroupInfo}>
          <span style={styles.mfeTag}>Host Shell 1 (Porta 3000)</span>
          <span style={styles.groupBadge}>Atividade Formativa 13</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* Componente Remoto 1 (OrderForm) via Webpack Module Federation */}
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

        {/* Painel e Tabela de Controle no Host Container */}
        <section style={styles.section}>
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <div>
                <h2 style={styles.tableTitle}>Painel Geral de Ordens de Serviço</h2>
                <p style={styles.tableSubtitle}>
                  Listagem integrada e controle em tempo real dos atendimentos de campo
                </p>
              </div>
              <div style={styles.countBadge}>
                Total: <strong>{orders.length} OS</strong>
              </div>
            </div>

            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Código OS</th>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Serviço Solicitado</th>
                    <th style={styles.th}>Técnico Responsável</th>
                    <th style={styles.th}>Prioridade</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Valor Est.</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={styles.emptyTd}>
                        Nenhuma ordem de serviço cadastrada no momento.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.id} style={styles.tr}>
                        <td style={styles.tdCode}>{ord.id}</td>
                        <td style={styles.tdBold}>{ord.cliente}</td>
                        <td style={styles.tdDesc}>{ord.servico}</td>
                        <td style={styles.tdText}>
                          {ord.tecnico !== 'Não atribuído' ? (
                            <span>👤 {ord.tecnico}</span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Não atribuído</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              ...getPriorityBadgeStyle(ord.prioridade),
                            }}
                          >
                            {ord.prioridade}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badgeStatus,
                              ...getStatusBadgeStyle(ord.situacao),
                            }}
                          >
                            {ord.situacao}
                          </span>
                        </td>
                        <td style={styles.tdValue}>
                          R$ {parseFloat(ord.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={styles.tdActions}>
                          {ord.situacao !== 'Concluída' && (
                            <button
                              onClick={() => handleCompleteOrder(ord.id)}
                              title="Marcar como Concluída"
                              style={styles.btnComplete}
                            >
                              ✓ Concluir
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            title="Excluir Ordem"
                            style={styles.btnDelete}
                          >
                            🗑️ Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
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
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(6, 38, 95, 0.06)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  tableTitle: {
    color: '#06265F',
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  tableSubtitle: {
    color: '#64748B',
    fontSize: '13px',
    margin: '4px 0 0 0',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    color: '#334155',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  thRow: {
    backgroundColor: '#F1F5F9',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '14px 16px',
    color: '#06265F',
    fontWeight: '700',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s',
  },
  emptyTd: {
    textAlign: 'center',
    padding: '32px',
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  tdCode: {
    padding: '14px 16px',
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#0B5FD7',
  },
  tdBold: {
    padding: '14px 16px',
    fontWeight: '600',
    color: '#1E293B',
  },
  tdDesc: {
    padding: '14px 16px',
    color: '#475569',
    maxWidth: '260px',
  },
  tdText: {
    padding: '14px 16px',
    color: '#334155',
  },
  td: {
    padding: '14px 16px',
  },
  tdValue: {
    padding: '14px 16px',
    fontWeight: '600',
    color: '#0F172A',
  },
  tdActions: {
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  badgeStatus: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  btnComplete: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #BBF7D0',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnDelete: {
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    border: '1px solid #FCA5A5',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '500',
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
