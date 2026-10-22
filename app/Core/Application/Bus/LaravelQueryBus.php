<?php

declare(strict_types=1);

namespace App\Core\Application\Bus;

use App\Core\Application\Contracts\QueryBusInterface;
use App\Core\Application\Contracts\QueryInterface;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

final class LaravelQueryBus implements QueryBusInterface
{
    /**
     * @var array<class-string<QueryInterface>, class-string>
     */
    private array $handlers = [];

    public function __construct(private readonly Container $container)
    {
    }

    public function register(string $queryClass, string $handlerClass): void
    {
        $this->handlers[$queryClass] = $handlerClass;
    }

    public function ask(QueryInterface $query): mixed
    {
        $queryClass = $query::class;

        $handlerClass = $this->handlers[$queryClass] ?? $this->resolveHandlerByConvention($queryClass);

        if (!class_exists($handlerClass)) {
            throw new InvalidArgumentException("Nenhum QueryHandler registrado para: {$queryClass}");
        }

        $handler = $this->container->make($handlerClass);

        return $handler->handle($query);
    }

    private function resolveHandlerByConvention(string $queryClass): string
    {
        return str_replace(
            ['\\Queries\\', 'Query'],
            ['\\Handlers\\', 'Handler'],
            $queryClass
        );
    }
}
