/**
 * TDE 4 - Testes de Arquitetura do BACKEND (os-service e tecnicos-service, TypeScript)
 * Ferramenta: dependency-cruiser. Regra com severity "error" => teste falha (exit code != 0).
 * Fluxo esperado: routes -> controllers -> db (repositorios) -> models.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Nao pode haver dependencias circulares',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'models-nao-dependem-de-outras-camadas',
      comment: 'Models sao a camada mais interna: nao importam controllers, routes nem db',
      severity: 'error',
      from: { path: '(^|/)src/models/' },
      to: { path: '(^|/)src/(controllers|routes|db)/' },
    },
    {
      name: 'db-nao-depende-de-controllers-ou-routes',
      comment: 'Camada de persistencia nao conhece a camada web',
      severity: 'error',
      from: { path: '(^|/)src/db/' },
      to: { path: '(^|/)src/(controllers|routes)/' },
    },
    {
      name: 'controllers-nao-dependem-de-routes',
      comment: 'Fluxo e Routes -> Controllers, nunca o contrario',
      severity: 'error',
      from: { path: '(^|/)src/controllers/' },
      to: { path: '(^|/)src/routes/' },
    },
    {
      name: 'routes-nao-acessam-db-direto',
      comment: 'Routes devem passar pelo Controller (nao acessam repositorio/banco)',
      severity: 'error',
      from: { path: '(^|/)src/routes/' },
      to: { path: '(^|/)src/db/' },
    },
    {
      name: 'database-per-service-os',
      comment: 'Database-per-Service: os-service nao importa codigo do tecnicos-service',
      severity: 'error',
      from: { path: '(^|/)os-service/' },
      to: { path: '(^|/)tecnicos-service/' },
    },
    {
      name: 'database-per-service-tecnicos',
      comment: 'Database-per-Service: tecnicos-service nao importa codigo do os-service',
      severity: 'error',
      from: { path: '(^|/)tecnicos-service/' },
      to: { path: '(^|/)os-service/' },
    },
  ],
  options: { doNotFollow: { path: 'node_modules' }, tsPreCompilationDeps: true },
};
