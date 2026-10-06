import React, { useState } from 'react';

const OrderList = ({ orders = [], onCompleteOrder, onDeleteOrder }) => {
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
  const [filterStatus, setFilterStatus] = useState('Todos');

  const filteredOrders = currentOrders.filter((ord) => {
    if (filterStatus === 'Todos') return true;
    return ord.situacao === filterStatus;
  });

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
    <div style={styles.tableCard}>
      <div style={styles.tableHeader}>
        <div>
          <div style={styles.headerBadge}>📋 Remote 2 MFE</div>
          <h2 style={styles.tableTitle}>Painel de Gestão & Listagem de OS</h2>
          <p style={styles.tableSubtitle}>
            Módulo remoto independente para monitoramento e controle dos atendimentos
          </p>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Filtrar Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.selectFilter}
          >
            <option value="Todos">Todos ({currentOrders.length})</option>
            <option value="Aberta">Aberta</option>
            <option value="Agendada">Agendada</option>
            <option value="Em execução">Em execução</option>
            <option value="Concluída">Concluída</option>
            <option value="Cancelada">Cancelada</option>
          </select>
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
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="8" style={styles.emptyTd}>
                  Nenhuma ordem de serviço encontrada com o filtro selecionado.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => (
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
                    <span style={{ ...styles.badge, ...getPriorityBadgeStyle(ord.prioridade) }}>
                      {ord.prioridade}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badgeStatus, ...getStatusBadgeStyle(ord.situacao) }}>
                      {ord.situacao}
                    </span>
                  </td>
                  <td style={styles.tdValue}>
                    R$ {parseFloat(ord.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={styles.tdActions}>
                    {ord.situacao !== 'Concluída' && onCompleteOrder && (
                      <button
                        onClick={() => onCompleteOrder(ord.id)}
                        title="Marcar como Concluída"
                        style={styles.btnComplete}
                      >
                        ✓ Concluir
                      </button>
                    )}
                    {onDeleteOrder && (
                      <button
                        onClick={() => onDeleteOrder(ord.id)}
                        title="Excluir Ordem"
                        style={styles.btnDelete}
                      >
                        🗑️ Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(6, 38, 95, 0.06)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerBadge: {
    display: 'inline-block',
    backgroundColor: '#06265F',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '4px',
    marginBottom: '6px',
    textTransform: 'uppercase',
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
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
  },
  selectFilter: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    outline: 'none',
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
};

export default OrderList;
