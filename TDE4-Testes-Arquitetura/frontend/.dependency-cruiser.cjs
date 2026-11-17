/**
 * TDE 4 - Testes de Arquitetura do FRONTEND (Micro-Frontends: host, remote, host-dashboard, remote-dashboard)
 * Ferramenta: dependency-cruiser. Cada regra com severity "error" quebra o teste (exit code != 0).
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
      name: 'hosts-nao-importam-codigo-dos-remotes',
      comment: 'Micro-frontends: Host nao pode importar arquivos do Remote diretamente (so via Module Federation)',
      severity: 'error',
      from: { path: '^\\.\\./(host|host-dashboard)/src|^(host|host-dashboard)/src' },
      to: { path: '(remote|remote-dashboard)/src' },
    },
    {
      name: 'remotes-nao-importam-codigo-dos-hosts',
      comment: 'Micro-frontends: Remote nao conhece o Host (baixo acoplamento)',
      severity: 'error',
      from: { path: '(^|/)(remote|remote-dashboard)/src' },
      to: { path: '(^|/)(host|host-dashboard)/src' },
    },
    {
      name: 'mfe-pares-isolados',
      comment: 'Os dois pares de MFE (OS e Dashboard) nao compartilham codigo',
      severity: 'error',
      from: { path: '(^|/)(host|remote)/src' },
      to: { path: '(^|/)(host-dashboard|remote-dashboard)/src' },
    },
    {
      name: 'frontend-nao-acessa-backend-ou-banco',
      comment: 'Frontend nao pode depender de drivers de banco (pg, sqlite) nem de express',
      severity: 'error',
      from: {},
      to: { path: 'node_modules/(pg|better-sqlite3|sqlite3|express)(/|$)' },
    },
    {
      name: 'index-apenas-carrega-bootstrap',
      comment: 'Padrao Module Federation: index.js so faz import dinamico do bootstrap (evita erro de shared eager)',
      severity: 'error',
      from: { path: 'src/index\\.js$' },
      to: { path: 'src/(?!bootstrap)', pathNot: 'src/index\\.js$' },
    },
  ],
  options: { doNotFollow: { path: 'node_modules' }, tsPreCompilationDeps: true },
};
