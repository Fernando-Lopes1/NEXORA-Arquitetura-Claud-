export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'NEXORA Field Service - tecnicos-service API',
    version: '1.0.0',
    description:
      '### 🖥️ [👉 CLIQUE AQUI PARA ABRIR A INTERFACE WEB DO CRUD (PAINEL VISUAL)](/app)\n\nMicrosserviço autônomo do ERP NEXORA para gestão da equipe técnica de campo (FSM). Implementa o padrão Database-per-Service com persistência PostgreSQL em nuvem e fallback autônomo em SQLite local.'
  },
  servers: [
    {
      url: 'http://localhost:8082',
      description: 'Servidor Local de Desenvolvimento (Porta 8082)'
    },
    {
      url: 'https://nexora-remote-dashboard-fernando.azurewebsites.net',
      description: 'Produção Azure Web App (nexora-remote-dashboard-fernando)'
    }
  ],
  tags: [
    {
      name: 'Técnicos de Campo',
      description: 'Operações CRUD e gestão de disponibilidade da equipe técnica'
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
    '/api/tecnicos': {
      get: {
        summary: 'Lista técnicos de campo com filtros opcionais',
        tags: ['Técnicos de Campo'],
        parameters: [
          {
            name: 'especialidade',
            in: 'query',
            description: 'Filtrar por especialidade técnica',
            schema: {
              type: 'string',
              enum: ['Climatização', 'Elétrica', 'Refrigeração', 'Mecânica']
            }
          },
          {
            name: 'regiao',
            in: 'query',
            description: 'Filtrar por região de atendimento (busca textual)',
            schema: { type: 'string' }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filtrar por status de disponibilidade',
            schema: {
              type: 'string',
              enum: ['Disponível', 'Em Atendimento', 'Ausente']
            }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de técnicos retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Tecnico' }
                }
              }
            }
          },
          '500': {
            description: 'Erro interno do servidor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Cadastra novo técnico de campo',
        tags: ['Técnicos de Campo'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTecnicoDto' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Técnico criado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tecnico' }
              }
            }
          },
          '400': {
            description: 'Dados inválidos ou campos obrigatórios ausentes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '500': {
            description: 'Erro interno do servidor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/tecnicos/{id}': {
      get: {
        summary: 'Detalha um técnico por ID',
        tags: ['Técnicos de Campo'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador numérico do técnico',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Técnico encontrado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tecnico' }
              }
            }
          },
          '400': {
            description: 'ID inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '404': {
            description: 'Técnico não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Atualiza dados cadastrais do técnico',
        tags: ['Técnicos de Campo'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador numérico do técnico',
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateTecnicoDto' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Técnico atualizado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tecnico' }
              }
            }
          },
          '400': {
            description: 'Dados inválidos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '404': {
            description: 'Técnico não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Remove um técnico',
        tags: ['Técnicos de Campo'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador numérico do técnico',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Técnico removido com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DeleteTecnicoResponse' }
              }
            }
          },
          '400': {
            description: 'ID inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '404': {
            description: 'Técnico não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/tecnicos/{id}/disponibilidade': {
      patch: {
        summary: 'Atualiza status de disponibilidade do técnico em campo',
        tags: ['Técnicos de Campo'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador numérico do técnico',
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateDisponibilidadeDto' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Disponibilidade atualizada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tecnico' }
              }
            }
          },
          '400': {
            description: 'Status de disponibilidade inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '404': {
            description: 'Técnico não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
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
          service: { type: 'string', example: 'tecnicos-service' },
          database: { type: 'string', example: 'connected' },
          provider: { type: 'string', example: 'SQLite' },
          uptime: { type: 'number', example: 12.34 },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Tecnico: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Carlos Eduardo Silva' },
          especialidade: {
            type: 'string',
            enum: ['Climatização', 'Elétrica', 'Refrigeração', 'Mecânica'],
            example: 'Climatização'
          },
          telefone: { type: 'string', nullable: true, example: '(11) 98765-4321' },
          email: { type: 'string', format: 'email', nullable: true, example: 'carlos.silva@nexora.com.br' },
          regiao: { type: 'string', nullable: true, example: 'Zona Sul - SP' },
          status: {
            type: 'string',
            enum: ['Disponível', 'Em Atendimento', 'Ausente'],
            example: 'Disponível'
          },
          criado_em: { type: 'string', format: 'date-time' },
          atualizado_em: { type: 'string', format: 'date-time' }
        }
      },
      CreateTecnicoDto: {
        type: 'object',
        required: ['nome', 'especialidade'],
        properties: {
          nome: { type: 'string', example: 'Carlos Eduardo Silva' },
          especialidade: {
            type: 'string',
            enum: ['Climatização', 'Elétrica', 'Refrigeração', 'Mecânica'],
            example: 'Climatização'
          },
          telefone: { type: 'string', nullable: true, example: '(11) 98765-4321' },
          email: { type: 'string', format: 'email', nullable: true, example: 'carlos.silva@nexora.com.br' },
          regiao: { type: 'string', nullable: true, example: 'Zona Sul - SP' },
          status: {
            type: 'string',
            enum: ['Disponível', 'Em Atendimento', 'Ausente'],
            default: 'Disponível',
            example: 'Disponível'
          }
        }
      },
      UpdateTecnicoDto: {
        type: 'object',
        properties: {
          nome: { type: 'string', example: 'Carlos Eduardo Silva' },
          especialidade: {
            type: 'string',
            enum: ['Climatização', 'Elétrica', 'Refrigeração', 'Mecânica'],
            example: 'Climatização'
          },
          telefone: { type: 'string', nullable: true, example: '(11) 98765-4321' },
          email: { type: 'string', format: 'email', nullable: true, example: 'carlos.silva@nexora.com.br' },
          regiao: { type: 'string', nullable: true, example: 'Zona Leste - SP' },
          status: {
            type: 'string',
            enum: ['Disponível', 'Em Atendimento', 'Ausente'],
            example: 'Em Atendimento'
          }
        }
      },
      UpdateDisponibilidadeDto: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['Disponível', 'Em Atendimento', 'Ausente'],
            example: 'Em Atendimento'
          }
        }
      },
      DeleteTecnicoResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Técnico removido com sucesso.' },
          id: { type: 'integer', example: 1 }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          erro: {
            type: 'string',
            example: 'Descrição detalhada do erro'
          }
        }
      }
    }
  }
};
