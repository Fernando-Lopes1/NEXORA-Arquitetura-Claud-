<?php

declare(strict_types=1);

namespace App\Core\Application\Bus;

use App\Core\Application\Contracts\CommandBusInterface;
use App\Core\Application\Contracts\CommandInterface;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

final class LaravelCommandBus implements CommandBusInterface
{
    /**
     * @var array<class-string<CommandInterface>, class-string>
     */
    private array $handlers = [];

    public function __construct(private readonly Container $container)
    {
    }

    public function register(string $commandClass, string $handlerClass): void
    {
        $this->handlers[$commandClass] = $handlerClass;
    }

    public function dispatch(CommandInterface $command): mixed
    {
        $commandClass = $command::class;

        $handlerClass = $this->handlers[$commandClass] ?? $this->resolveHandlerByConvention($commandClass);

        if (!class_exists($handlerClass)) {
            throw new InvalidArgumentException("Nenhum CommandHandler registrado para: {$commandClass}");
        }

        $handler = $this->container->make($handlerClass);

        return $handler->handle($command);
    }

    private function resolveHandlerByConvention(string $commandClass): string
    {
        return str_replace(
            ['\\Commands\\', 'Command'],
            ['\\Handlers\\', 'Handler'],
            $commandClass
        );
    }
}
