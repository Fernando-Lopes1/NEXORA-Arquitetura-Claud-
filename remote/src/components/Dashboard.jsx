import React from 'react';

const Dashboard = ({ orders = [] }) => {
  // Dados de fallback caso nenhuma lista seja fornecida
  const defaultOrders = [
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
  ];

  const currentOrders = orders.length > 0 ? orders : defaultOrders;

  // Cálculo de Métricas e KPIs em Tempo Real
  const totalOrders = currentOrders.length;
  const completedOrders = currentOrders.filter((o) => o.situacao === 'Concluída').length;
  const activeOrders = currentOrders.filter(
    (o) => o.situacao === 'Em execução' || o.situacao === 'Agendada' || o.situacao === 'Aberta'
  ).length;

  const totalValue = currentOrders.reduce(
    (acc, curr) => acc + (parseFloat(curr.valorEstimado) || 0),
    0
  );

  const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(0) : 0;

  // Contagem por Status
  const statusCounts = {
    Aberta: currentOrders.filter((o) => o.situacao === 'Aberta').length,
    Agendada: currentOrders.filter((o) => o.situacao === 'Agendada').length,
    'Em execução': currentOrders.filter((o) => o.situacao === 'Em execução').length,
    Concluída: currentOrders.filter((o) => o.situacao === 'Concluída').length,
    Cancelada: currentOrders.filter((o) => o.situacao === 'Cancelada').length,
  };

  // Contagem por Prioridade
  const priorityCounts = {
    Urgente: currentOrders.filter((o) => o.prioridade === 'Urgente').length,
    Alta: currentOrders.filter((o) => o.prioridade === 'Alta').length,
    Média: currentOrders.filter((o) => o.prioridade === 'Média').length,
    Baixa: currentOrders.filter((o) => o.prioridade === 'Baixa').length,
  };

  // Resumo por Técnico
  const technicianMap = currentOrders.reduce((acc, curr) => {
    const tec = curr.tecnico && curr.tecnico !== 'Não atribuído' ? curr.tecnico : 'Pendente de Atribuição';
    if (!acc[tec]) {
      acc[tec] = { total: 0, valor: 0 };
    }
    acc[tec].total += 1;
    acc[tec].valor += parseFloat(curr.valorEstimado) || 0;
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      {/* Header do MFE Dashboard */}
      <div style={styles.cardHeader}>
        <div style={styles.headerBadge}>📊 Remote MFE</div>
        <div>
          <h2 style={styles.cardTitle}>Painel de Indicadores & Performance (KPIs)</h2>
          <p style={styles.cardSubtitle}>
            Módulo analítico em tempo real para gestão estratégica de serviços de campo
          </p>
        </div>
      </div>

      {/* Grid de Cards de Métricas Principais */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiIconBox}>📋</div>
          <div>
            <span style={styles.kpiLabel}>Total de Ordens</span>
            <h3 style={styles.kpiValue}>{totalOrders}</h3>
            <span style={styles.kpiSubtext}>Atendimentos mapeados</span>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: '#DCFCE7', color: '#15803D' }}>
            ✓
          </div>
          <div>
            <span style={styles.kpiLabel}>Taxa de Conclusão</span>
            <h3 style={styles.kpiValue}>{completionRate}%</h3>
            <span style={styles.kpiSubtext}>{completedOrders} OS finalizadas</span>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: '#FEF3C7', color: '#B45309' }}>
            ⚡
          </div>
          <div>
            <span style={styles.kpiLabel}>Em Andamento</span>
            <h3 style={styles.kpiValue}>{activeOrders}</h3>
            <span style={styles.kpiSubtext}>OS abertas e em campo</span>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: '#E0F2FE', color: '#0369A1' }}>
            💰
          </div>
          <div>
            <span style={styles.kpiLabel}>Valor Total Estimado</span>
            <h3 style={styles.kpiValue}>
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <span style={styles.kpiSubtext}>Volume financeiro total</span>
          </div>
        </div>
      </div>

      {/* Seção de Gráficos e Distribuições Visuais */}
      <div style={styles.distributionGrid}>
        {/* Distribuição por Status */}
        <div style={styles.subCard}>
          <h4 style={styles.subCardTitle}>📌 Status dos Atendimentos</h4>
          <div style={styles.barGroup}>
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
              return (
                <div key={status} style={styles.barRow}>
                  <div style={styles.barLabelRow}>
                    <span style={styles.statusName}>{status}</span>
                    <span style={styles.statusCount}>
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${pct}%`,
                        backgroundColor: getStatusColor(status),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição por Prioridade */}
        <div style={styles.subCard}>
          <h4 style={styles.subCardTitle}>🎯 Nível de Prioridade</h4>
          <div style={styles.barGroup}>
            {Object.entries(priorityCounts).map(([priority, count]) => {
              const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
              return (
                <div key={priority} style={styles.barRow}>
                  <div style={styles.barLabelRow}>
                    <span style={styles.statusName}>{priority}</span>
                    <span style={styles.statusCount}>
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${pct}%`,
                        backgroundColor: getPriorityColor(priority),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela de Produtividade dos Técnicos */}
      <div style={{ ...styles.subCard, marginTop: '20px' }}>
        <h4 style={styles.subCardTitle}>👥 Carga de Trabalho por Técnico de Campo</h4>
        <div style={styles.techList}>
          {Object.entries(technicianMap).map(([tecName, data]) => (
            <div key={tecName} style={styles.techRow}>
              <div style={styles.techAvatar}>
                {tecName !== 'Pendente de Atribuição' ? '👤' : '⚠️'}
              </div>
              <div style={styles.techInfo}>
                <span style={styles.techName}>{tecName}</span>
                <span style={styles.techDesc}>
                  {data.total} {data.total === 1 ? 'Ordem atribuída' : 'Ordens atribuídas'}
                </span>
              </div>
              <div style={styles.techValue}>
                R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Funções Auxiliares de Cores
const getStatusColor = (status) => {
  switch (status) {
    case 'Aberta':
      return '#0284C7';
    case 'Agendada':
      return '#4F46E5';
    case 'Em execução':
      return '#D97706';
    case 'Concluída':
      return '#16A34A';
    case 'Cancelada':
      return '#DC2626';
    default:
      return '#64748B';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Urgente':
      return '#DC2626';
    case 'Alta':
      return '#EA580C';
    case 'Média':
      return '#2563EB';
    case 'Baixa':
      return '#64748B';
    default:
      return '#64748B';
  }
};

const styles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(6, 38, 95, 0.06)',
    border: '1px solid #E2E8F0',
    padding: '24px',
    marginBottom: '24px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
  },
  headerBadge: {
    backgroundColor: '#06265F',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '700',
    padding: '6px 10px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#06265F',
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: '13px',
    margin: '3px 0 0 0',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  kpiIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '2px 0',
  },
  kpiSubtext: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  distributionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  subCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '20px',
  },
  subCardTitle: {
    color: '#06265F',
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 16px 0',
  },
  barGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  barRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  barLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  statusName: {
    fontWeight: '600',
    color: '#334155',
  },
  statusCount: {
    color: '#64748B',
    fontSize: '12px',
  },
  barTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: '#E2E8F0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },
  techList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  techRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#FFFFFF',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
  },
  techAvatar: {
    fontSize: '18px',
  },
  techInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  techName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
  },
  techDesc: {
    fontSize: '11px',
    color: '#64748B',
  },
  techValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#06265F',
  },
};

export default Dashboard;
