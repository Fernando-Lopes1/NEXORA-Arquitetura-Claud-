import React, { useState } from 'react';
import OrderForm from './components/OrderForm';
import Dashboard from './components/Dashboard';

const App = () => {
  const [standaloneOrders, setStandaloneOrders] = useState([
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

  const [activeTab, setActiveTab] = useState('dashboard');

  const handleAddOrder = (newOrder) => {
    setStandaloneOrders((prev) => [newOrder, ...prev]);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>NEXORA Remote Micro-Frontend</h1>
          <p style={styles.headerSubtitle}>Módulos: OrderForm & Dashboard</p>
        </div>
        <span style={styles.headerBadge}>Porta 3001 - Autônomo</span>
      </header>

      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'dashboard' ? styles.activeTab : {}),
          }}
        >
          📊 Dashboard & KPIs
        </button>
        <button
          onClick={() => setActiveTab('form')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'form' ? styles.activeTab : {}),
          }}
        >
          📝 Nova Ordem de Serviço
        </button>
      </div>

      <main style={styles.main}>
        {activeTab === 'dashboard' ? (
          <Dashboard orders={standaloneOrders} />
        ) : (
          <OrderForm onAddOrder={handleAddOrder} />
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    padding: '24px',
    fontFamily: 'sans-serif',
  },
  header: {
    backgroundColor: '#06265F',
    color: '#FFFFFF',
    padding: '20px 28px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerTitle: {
    fontSize: '20px',
    margin: 0,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#94A3B8',
    margin: '4px 0 0 0',
  },
  headerBadge: {
    backgroundColor: '#0B5FD7',
    color: '#FFFFFF',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  tabContainer: {
    maxWidth: '1000px',
    margin: '0 auto 20px auto',
    display: 'flex',
    gap: '12px',
  },
  tabButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeTab: {
    backgroundColor: '#06265F',
    color: '#FFFFFF',
    borderColor: '#06265F',
  },
  main: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
};

export default App;
