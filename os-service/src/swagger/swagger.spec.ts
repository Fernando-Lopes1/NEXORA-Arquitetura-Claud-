export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'NEXORA Field Service - os-service API',
    version: '1.0.0',
    description: 'Microsserviço autônomo do ERP NEXORA para gerenciamento de Ordens de Serviço (FSM). Implementa o padrão Database-per-Service com persistência PostgreSQL em nuvem e fallback autônomo em SQLite local.'
  },
  servers: [
    {
      url: 'http://localhost:8081',
      description: 'Servidor Local de Desenvolvimento (Porta 8081)'
    },
    {
      url: 'https://nexora-remote-fernando.azurewebsites.net',
      description: 'Produção Azure Web App (nexora-remote-fernando)'
    }
  ],
  tags: [
    {
      name: 'Ordens de Serviço',
      description: 'Operações CRUD e transições de ciclo de vida de Ordens de Serviço'
    },
    {
      name: 'Health',
      description: 'Verificação de integridade e liveness probe'
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Verificação de integridade e status da conexão com banco',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'Serviço operacional',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/ordens': {
      get: {
        summary: 'Lista ordens de serviço com filtros opcionais',
        tags: ['Ordens de Serviço'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filtrar por status',
            schema: {
              type: 'string',
              enum: ['Aberta', 'Agendada', 'Em Execução', 'Concluída', 'Cancelada']
            }
          },
          {
            name: 'prioridade',
            in: 'query',
            description: 'Filtrar por prioridade',
            schema: {
              type: 'string',
              enum: ['Baixa', 'Média', 'Alta', 'Urgente']
            }
          },
          {
            name: 'cliente',
            in: 'query',
            description: 'Busca textual parcial no nome do cliente',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de ordens retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/OrdemServico' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Cadastra nova Ordem de Serviço',
        tags: ['Ordens de Serviço'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrdemDto' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Ordem de serviço criada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrdemServico' }
              }
            }
          },
          '400': {
            description: 'Dados inválidos ou campos obrigatórios ausentes'
          }
        }
      }
    },
    '/api/ordens/{id}': {
      get: {
        summary: 'Detalha uma ordem de serviço pelo ID',
        tags: ['Ordens de Serviço'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador numérico da OS',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Ordem de serviço detalhada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrdemServico' }
              }
            }
          },
          '400': { description: 'ID inválido' },
          '404': { description: 'Ordem de serviço não encontrada' }
        }
      },
      put: {
        summary: 'Atualiza dados cadastrais da ordem de serviço',
        tags: ['Ordens de Serviço'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador numérico da OS',
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateOrdemDto' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Ordem atualizada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrdemServico' }
              }
            }
          },
          '400': { description: 'Dados inválidos ou transição de ciclo de vida ilegal' },
          '404': { description: 'Ordem de serviço não encontrada' }
        }
      },
      delete: {
        summary: 'Remove uma ordem de serviço',
        tags: ['Ordens de Serviço'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador numérico da OS',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Ordem de serviço removida com sucesso'
          },
          '400': { description: 'ID inválido' },
          '404': { description: 'Ordem de serviço não encontrada' }
        }
      }
    },
    '/api/ordens/{id}/status': {
      patch: {
        summary: 'Atualiza o status com validação estrita de ciclo de vida',
        tags: ['Ordens de Serviço'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador numérico da OS',
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateStatusDto' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Status atualizado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrdemServico' }
              }
            }
          },
          '400': { description: 'Transição ilegal ou ausência de técnico atribuído' },
          '404': { description: 'Ordem de serviço não encontrada' }
        }
      }
    }
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'UP' },
          service: { type: 'string', example: 'os-service' },
          database: { type: 'string', example: 'connected' },
          provider: { type: 'string', example: 'SQLite' },
          uptime: { type: 'number', example: 12.34 },
          timestamp: { type: 'string', example: '2026-10-08T14:45:00.000Z' }
        }
      },
      OrdemServico: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          cliente: { type: 'string', example: 'Condomínio Edifício Alto da XV' },
          descricao: { type: 'string', example: 'Manutenção preventiva de 3 splits hi-wall e higienização química' },
          tecnico: { type: 'string', nullable: true, example: 'Rafael Lima' },
          tecnico_atribuido: { type: 'string', nullable: true, example: 'Rafael Lima' },
          prioridade: { type: 'string', enum: ['Baixa', 'Média', 'Alta', 'Urgente'], example: 'Média' },
          status: { type: 'string', enum: ['Aberta', 'Agendada', 'Em Execução', 'Concluída', 'Cancelada'], example: 'Agendada' },
          valor_estimado: { type: 'number', example: 450.00 },
          prazo: { type: 'string', nullable: true, example: '2026-10-15' },
          criado_em: { type: 'string', example: '2026-10-06T12:00:00.000Z' },
          atualizado_em: { type: 'string', example: '2026-10-08T12:00:00.000Z' }
        }
      },
      CreateOrdemDto: {
        type: 'object',
        required: ['cliente', 'descricao'],
        properties: {
          cliente: { type: 'string', example: 'Mercado São Braz Comércio' },
          descricao: { type: 'string', example: 'Vazamento contínuo de água na evaporadora' },
          tecnico: { type: 'string', nullable: true, example: 'Jonas Sena' },
          tecnico_atribuido: { type: 'string', nullable: true, example: 'Jonas Sena' },
          prioridade: { type: 'string', enum: ['Baixa', 'Média', 'Alta', 'Urgente'], default: 'Média' },
          status: { type: 'string', enum: ['Aberta', 'Agendada', 'Em Execução', 'Concluída', 'Cancelada'], default: 'Aberta' },
          valor_estimado: { type: 'number', default: 0.00, example: 350.00 },
          prazo: { type: 'string', nullable: true, example: '2026-10-20' }
        }
      },
      UpdateOrdemDto: {
        type: 'object',
        properties: {
          cliente: { type: 'string', example: 'Mercado São Braz Comércio' },
          descricao: { type: 'string', example: 'Vazamento contínuo de água na evaporadora e troca do dreno' },
          tecnico: { type: 'string', nullable: true, example: 'Marcelo Duarte' },
          tecnico_atribuido: { type: 'string', nullable: true, example: 'Marcelo Duarte' },
          prioridade: { type: 'string', enum: ['Baixa', 'Média', 'Alta', 'Urgente'] },
          status: { type: 'string', enum: ['Aberta', 'Agendada', 'Em Execução', 'Concluída', 'Cancelada'] },
          valor_estimado: { type: 'number', example: 400.00 },
          prazo: { type: 'string', nullable: true, example: '2026-10-25' }
        }
      },
      UpdateStatusDto: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['Aberta', 'Agendada', 'Em Execução', 'Concluída', 'Cancelada'],
            example: 'Agendada'
          },
          tecnico: {
            type: 'string',
            nullable: true,
            example: 'Jonas Sena'
          },
          tecnico_atribuido: {
            type: 'string',
            nullable: true,
            example: 'Jonas Sena'
          }
        }
      }
    }
  }
};
