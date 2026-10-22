<?php

declare(strict_types=1);

namespace App\Core\Application\Contracts;

interface CommandBusInterface
{
    public function dispatch(CommandInterface $command): mixed;

    public function register(string $commandClass, string $handlerClass): void;
}
