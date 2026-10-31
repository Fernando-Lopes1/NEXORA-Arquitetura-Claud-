<?php

/**
 *  Testes de Arquitetura do GATEWAY (Laravel 11 / PHP 8.3)
 * Ferramenta: Pest Arch (pestphp/pest-plugin-arch)
 * Padroes verificados: MVC, CQRS, DDD, SOLID, API Gateway/BFF.
 */

// ---------- Camadas (Clean Architecture / DDD) ----------
arch('o Dominio nao depende de Laravel/Illuminate (dominio puro)')
    ->expect('App\Core\Domain')
    ->not->toUse(['Illuminate', 'App\Http', 'App\Models'])
    // Excecao conhecida e documentada: AbstractDomainEvent usa Illuminate\Support\Str (apenas helper de UUID)
    ->ignoring('App\Core\Domain\Events\AbstractDomainEvent');

arch('o Dominio nao depende das camadas Application e Infrastructure')
    ->expect('App\Core\Domain')
    ->not->toUse(['App\Core\Application', 'App\Core\Infrastructure']);

arch('a Application nao depende de Controllers (Http)')
    ->expect('App\Core\Application')
    ->not->toUse('App\Http');

// ---------- MVC ----------
arch('Controllers nao acessam o banco diretamente (DB facade)')
    ->expect('App\Http\Controllers')
    ->not->toUse(['Illuminate\Support\Facades\DB']);

arch('Models nao dependem de Controllers')
    ->expect('App\Models')
    ->not->toUse('App\Http\Controllers');

arch('Controllers terminam com o sufixo Controller')
    ->expect('App\Http\Controllers')
    ->toHaveSuffix('Controller');

arch('Form Requests estendem FormRequest')
    ->expect('App\Http\Requests')
    ->toExtend('Illuminate\Foundation\Http\FormRequest');

// ---------- CQRS ----------
arch('Handlers terminam com o sufixo Handler')
    ->expect('App\Core\Application\Handlers')
    ->toHaveSuffix('Handler');

arch('Commands terminam com o sufixo Command e implementam CommandInterface')
    ->expect('App\Core\Application\Commands')
    ->toHaveSuffix('Command')
    ->toImplement('App\Core\Application\Contracts\CommandInterface');

arch('Queries terminam com o sufixo Query e implementam QueryInterface')
    ->expect('App\Core\Application\Queries')
    ->toHaveSuffix('Query')
    ->toImplement('App\Core\Application\Contracts\QueryInterface');

// ---------- SOLID ----------
arch('Contratos em Application\Contracts sao interfaces (DIP)')
    ->expect('App\Core\Application\Contracts')
    ->toBeInterfaces();

arch('Strategies de preco implementam PricingStrategyInterface (OCP)')
    ->expect('App\Core\Application\Strategies')
    ->toImplement('App\Core\Application\Contracts\PricingStrategyInterface');

arch('Eventos de dominio implementam DomainEventInterface')
    ->expect('App\Core\Domain\Events')
    ->classes()
    ->toImplement('App\Core\Domain\Events\DomainEventInterface')
    ->ignoring('App\Core\Domain\Events\DomainEventInterface');

// ---------- Boas praticas ----------
arch('nao ha funcoes de debug no codigo')
    ->expect(['dd', 'dump', 'var_dump', 'print_r', 'die', 'exit'])
    ->not->toBeUsed();

arch('arquivos usam strict types no Core')
    ->expect('App\Core')
    ->toUseStrictTypes();
