# TDE 4 – Testes de Arquitetura (NEXORA)

| Bloco | Projetos | Ferramenta | Pasta |
|---|---|---|---|
| Gateway | Laravel 11 (`app/`) | Pest Arch | `gateway/` |
| Backend (TS) | `os-service`, `tecnicos-service` | [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) | `backend/` |
| Frontend | `host`, `remote`, `host-dashboard`, `remote-dashboard` | [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) | `frontend/` |

Integrantes: [GRUPO.md](GRUPO.md). Saídas reais: `evidencias/`.

## Como executar (pasta dentro do repositório)
```bash
# Gateway (PHP) – 15 testes
composer install
vendor/bin/pest --testsuite=Arch

# Backend TS + Frontend (Node >= 20)
cd TDE4-Testes-Arquitetura
npm install
npm run test:backend    # 7 regras, 41 módulos
npm run test:frontend   # 6 regras, 20 módulos
```

## Regras
- **Gateway:** domínio puro, Application sem Http, Controllers sem `DB::`, CQRS (sufixos/interfaces), SOLID (interfaces/Strategies), sem `dd/dump`, `strict_types`.
- **Backend:** sem ciclos; Models não dependem de controllers/routes/db; db não depende de controllers/routes; Controllers não dependem de Routes; Routes não acessam db direto; Database-per-Service (um microsserviço não importa o outro).
- **Frontend:** sem ciclos; Host ↔ Remote isolados (só via Module Federation); pares de MFE isolados; sem drivers de banco/express; `index.js` só carrega `bootstrap`.

## Exceção documentada
`AbstractDomainEvent` usa `Illuminate\Support\Str` – ignorada na regra de domínio puro.
