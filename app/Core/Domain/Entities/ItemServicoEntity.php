<?php

declare(strict_types=1);

namespace App\Core\Domain\Entities;

use App\Core\Domain\ValueObjects\ValorMonetario;
use InvalidArgumentException;

final class ItemServicoEntity
{
    public function __construct(
        private string $id,
        private string $descricao,
        private int $quantidade,
        private ValorMonetario $valorUnitario,
    ) {
        if (trim($descricao) === '') {
            throw new InvalidArgumentException('Descrição do item de serviço não pode ser vazia.');
        }

        if ($quantidade <= 0) {
            throw new InvalidArgumentException('Quantidade do item de serviço deve ser maior que zero.');
        }
    }

    public function id(): string
    {
        return $this->id;
    }

    public function descricao(): string
    {
        return $this->descricao;
    }

    public function quantidade(): int
    {
        return $this->quantidade;
    }

    public function valorUnitario(): ValorMonetario
    {
        return $this->valorUnitario;
    }

    public function subtotal(): ValorMonetario
    {
        return $this->valorUnitario->multiplicarPorFator((float) $this->quantidade);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'descricao' => $this->descricao,
            'quantidade' => $this->quantidade,
            'valor_unitario' => $this->valorUnitario->emReais(),
            'valor_unitario_formatado' => $this->valorUnitario->formatar(),
            'subtotal' => $this->subtotal()->emReais(),
            'subtotal_formatado' => $this->subtotal()->formatar(),
        ];
    }
}
