<?php

declare(strict_types=1);

namespace App\Core\Application\Contracts;

interface QueryBusInterface
{
    public function ask(QueryInterface $query): mixed;

    public function register(string $queryClass, string $handlerClass): void;
}
