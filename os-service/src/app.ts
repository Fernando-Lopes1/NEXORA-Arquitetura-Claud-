import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger/swagger.spec';
import healthRoutes from './routes/health.routes';
import ordemRoutes from './routes/ordem.routes';

const app: Application = express();

// Middlewares globais
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentação Swagger UI interativa em /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'NEXORA - os-service Swagger UI',
  swaggerOptions: { persistAuthorization: true, displayRequestDuration: true }
}));

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
