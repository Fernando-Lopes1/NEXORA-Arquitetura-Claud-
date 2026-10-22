<?php

declare(strict_types=1);

namespace App\Core\Saga;

interface SagaStepInterface
{
    public function name(): string;

    public function compensationName(): string;

    public function execute(SagaContext $ctx): bool;

    public function compensate(SagaContext $ctx): void;
}
