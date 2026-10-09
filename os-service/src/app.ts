import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger/swagger.spec';
import healthRoutes from './routes/health.routes';
import ordemRoutes from './routes/ordem.routes';
import { getOsAppHtml } from './views/appHtml';

const app: Application = express();

// Middlewares globais
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentação Swagger UI interativa em /api-docs com banner para o Painel Visual
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'NEXORA - os-service Swagger UI',
  customCss: `
    .topbar { background-color: #0f172a !important; border-bottom: 2px solid #06b6d4; }
    .swagger-ui .info h2 { color: #0284c7; }
  `,
  swaggerOptions: { persistAuthorization: true, displayRequestDuration: true }
}));

// Rota para a aplicação visual completa do CRUD
app.get('/app', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(getOsAppHtml());
});

// Rota raiz redireciona para o Swagger UI
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// Endpoint com o contrato bruto OpenAPI JSON
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Rotas da API
app.use('/health', healthRoutes);
app.use('/api/ordens', ordemRoutes);

// Fallback 404 para rotas não mapeadas
app.use((req: Request, res: Response) => {
  res.status(404).json({ erro: `Rota '${req.method} ${req.url}' não encontrada.` });
});

export default app;
