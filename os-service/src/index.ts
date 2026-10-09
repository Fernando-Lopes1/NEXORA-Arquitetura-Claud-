import app from './app';
import { config } from './config/env';
import { getDatabase } from './db/factory';

async function bootstrap() {
  try {
    // Inicializa o banco de dados (Cloud PostgreSQL ou SQLite autônomo)
    const db = await getDatabase();
    console.log(`📦 Provedor de Banco de Dados ativo: ${db.getProviderName()}`);

    const PORT = config.port;
    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 [os-service] NEXORA Ordem de Serviço Microservice`);
      console.log(`🌐 Servidor rodando na porta: ${PORT}`);
      console.log(`📖 Documentação Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`🩺 Health Check Endpoint:  http://localhost:${PORT}/health`);
      console.log(`🔗 API Ordens Endpoint:    http://localhost:${PORT}/api/ordens`);
      console.log('====================================================');
    });

    const shutdown = async () => {
      console.log('\n🛑 Encerrando [os-service] graciosamente...');
      server.close(async () => {
        try {
          await db.close();
          console.log('✅ Conexões de banco fechadas.');
        } catch (closeErr: any) {
          console.error('Erro ao fechar conexões de banco:', closeErr.message);
        }
        console.log('✅ Processo finalizado.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error: any) {
    console.error('❌ Falha fatal ao inicializar [os-service]:', error);
    process.exit(1);
  }
}

bootstrap();
