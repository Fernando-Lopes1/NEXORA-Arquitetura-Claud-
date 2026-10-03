import React, { useState } from 'react';

const OrderForm = ({ onAddOrder }) => {
  const initialFormState = {
    cliente: '',
    servico: '',
    tecnico: '',
    prioridade: 'Média',
    situacao: 'Aberta',
    valorEstimado: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.cliente.trim()) {
      newErrors.cliente = 'O nome do cliente é obrigatório.';
    }

    if (!formData.servico.trim()) {
      newErrors.servico = 'A descrição do serviço solicitado é obrigatória.';
    }

    if (
      (formData.situacao === 'Agendada' || formData.situacao === 'Em execução') &&
      !formData.tecnico.trim()
    ) {
      newErrors.tecnico = `Técnico responsável é obrigatório quando o status é "${formData.situacao}".`;
    }

    if (formData.valorEstimado && isNaN(Number(formData.valorEstimado.replace(',', '.')))) {
      newErrors.valorEstimado = 'Informe um valor numérico válido (ex: 350.50).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validate()) return;

    const formattedValue = formData.valorEstimado
      ? parseFloat(formData.valorEstimado.replace(',', '.')).toFixed(2)
      : '0.00';

    const newOrder = {
      id: 'OS-' + Math.floor(1000 + Math.random() * 9000),
      cliente: formData.cliente.trim(),
      servico: formData.servico.trim(),
      tecnico: formData.tecnico.trim() || 'Não atribuído',
      prioridade: formData.prioridade,
      situacao: formData.situacao,
      valorEstimado: formattedValue,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
    };

    if (typeof onAddOrder === 'function') {
      onAddOrder(newOrder);
    }

    setSuccessMessage(`Ordem de Serviço ${newOrder.id} criada com sucesso!`);
    handleClear();

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const handleClear = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.headerBadge}>⚡ Remote MFE</div>
        <div>
          <h2 style={styles.cardTitle}>Abertura de Ordem de Serviço (OS)</h2>
          <p style={styles.cardSubtitle}>
            Módulo remoto do NEXORA Field Service Management
          </p>
        </div>
      </div>

      {successMessage && (
        <div style={styles.alertSuccess}>
          <span style={{ fontSize: '18px' }}>✓</span> {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <div style={styles.colHalf}>
            <label style={styles.label}>
              Cliente <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="cliente"
              value={formData.cliente}
              onChange={handleChange}
              placeholder="Razão social ou nome do cliente"
              style={{
                ...styles.input,
                borderColor: errors.cliente ? '#EF4444' : '#CBD5E1',
              }}
            />
            {errors.cliente && <span style={styles.errorText}>{errors.cliente}</span>}
          </div>

          <div style={styles.colHalf}>
            <label style={styles.label}>
              Serviço Solicitado <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="servico"
              value={formData.servico}
              onChange={handleChange}
              placeholder="Ex: Instalação de ponto de fibra / Manutenção"
              style={{
                ...styles.input,
                borderColor: errors.servico ? '#EF4444' : '#CBD5E1',
              }}
            />
            {errors.servico && <span style={styles.errorText}>{errors.servico}</span>}
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.colThird}>
            <label style={styles.label}>
              Técnico Responsável{' '}
              {(formData.situacao === 'Agendada' || formData.situacao === 'Em execução') && (
                <span style={styles.required}>*</span>
              )}
            </label>
            <input
              type="text"
              name="tecnico"
              value={formData.tecnico}
              onChange={handleChange}
              placeholder="Nome do técnico de campo"
              style={{
                ...styles.input,
                borderColor: errors.tecnico ? '#EF4444' : '#CBD5E1',
              }}
            />
            {errors.tecnico && <span style={styles.errorText}>{errors.tecnico}</span>}
          </div>

          <div style={styles.colThird}>
            <label style={styles.label}>Prioridade</label>
            <select
              name="prioridade"
              value={formData.prioridade}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          <div style={styles.colThird}>
            <label style={styles.label}>Situação / Status</label>
            <select
              name="situacao"
              value={formData.situacao}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="Aberta">Aberta</option>
              <option value="Agendada">Agendada</option>
              <option value="Em execução">Em execução</option>
              <option value="Concluída">Concluída</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.colHalf}>
            <label style={styles.label}>Valor Estimado (R$)</label>
            <input
              type="text"
              name="valorEstimado"
              value={formData.valorEstimado}
              onChange={handleChange}
              placeholder="Ex: 250.00"
              style={{
                ...styles.input,
                borderColor: errors.valorEstimado ? '#EF4444' : '#CBD5E1',
              }}
            />
            {errors.valorEstimado && (
              <span style={styles.errorText}>{errors.valorEstimado}</span>
            )}
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button type="button" onClick={handleClear} style={styles.btnSecondary}>
            Limpar Formulário
          </button>
          <button type="submit" style={styles.btnPrimary}>
            + Registrar Ordem de Serviço
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  card: {
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
  alertSuccess: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #BBF7D0',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  colHalf: {
    flex: '1 1 calc(50% - 8px)',
    minWidth: '240px',
    display: 'flex',
    flexDirection: 'column',
  },
  colThird: {
    flex: '1 1 calc(33.333% - 11px)',
    minWidth: '200px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    fontFamily: 'inherit',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  errorText: {
    color: '#EF4444',
    fontSize: '12px',
    marginTop: '4px',
    fontWeight: '500',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #F1F5F9',
  },
  btnPrimary: {
    backgroundColor: '#0B5FD7',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 22px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(11, 95, 215, 0.2)',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default OrderForm;
