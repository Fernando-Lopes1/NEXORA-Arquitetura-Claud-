import React, { useState } from 'react';
import Dashboard from './components/Dashboard';

const App = () => {
  const [standaloneOrders] = useState([
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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>NEXORA Remote 2 - Dashboard MFE</h1>
          <p style={styles.headerSubtitle}>Micro-Frontend 2 Independente</p>
        </div>
        <span style={styles.headerBadge}>Porta 3002 - Autônomo</span>
      </header>

      <main style={styles.main}>
        <Dashboard orders={standaloneOrders} />
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
  main: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
};

export default App;
