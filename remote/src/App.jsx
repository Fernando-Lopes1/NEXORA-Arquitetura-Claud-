import React, { useState } from 'react';
import OrderForm from './components/OrderForm';

const App = () => {
  const [standaloneOrders, setStandaloneOrders] = useState([]);

  const handleAddOrder = (newOrder) => {
    setStandaloneOrders((prev) => [newOrder, ...prev]);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>NEXORA Remote Micro-Frontend</h1>
        <span style={styles.headerBadge}>Porta 3001 - Autônomo</span>
      </header>

      <main style={styles.main}>
        <OrderForm onAddOrder={handleAddOrder} />

        {standaloneOrders.length > 0 && (
          <div style={styles.standaloneList}>
            <h3 style={styles.listTitle}>
              Ordens Registradas Localmente (Modo Standalone):
            </h3>
            <ul style={styles.ul}>
              {standaloneOrders.map((ord) => (
                <li key={ord.id} style={styles.li}>
                  <strong>{ord.id}</strong> - {ord.cliente} ({ord.servico}) | Técnico: {ord.tecnico} | Status: {ord.situacao}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    padding: '20px',
  },
  header: {
    backgroundColor: '#06265F',
    color: '#FFFFFF',
    padding: '16px 24px',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  headerTitle: {
    fontSize: '20px',
    margin: 0,
  },
  headerBadge: {
    backgroundColor: '#0B5FD7',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  main: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  standaloneList: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #E2E8F0',
  },
  listTitle: {
    color: '#06265F',
    fontSize: '16px',
    marginTop: 0,
  },
  ul: {
    margin: '10px 0 0 0',
    paddingLeft: '20px',
  },
  li: {
    marginBottom: '8px',
    fontSize: '14px',
    color: '#334155',
  },
};

export default App;
