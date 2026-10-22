<?php

declare(strict_types=1);

namespace App\Core\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class PrioridadeOrdem
{
    public const BAIXA = 'Baixa';
    public const MEDIA = 'Média';
    public const ALTA = 'Alta';
    public const URGENTE = 'Urgente';

    private const SLA_HORAS = [
        self::BAIXA => 72,
        self::MEDIA => 24,
        self::ALTA => 8,
        self::URGENTE => 2,
    ];

    private const MULTIPLICADORES_CUSTO = [
        self::BAIXA => 1.00,
        self::MEDIA => 1.00,
        self::ALTA => 1.15,
        self::URGENTE => 1.35,
    ];

    private string $nivel;

    private function __construct(string $nivel)
    {
        $normalizado = self::normalizar($nivel);
        if (!array_key_exists($normalizado, self::SLA_HORAS)) {
            throw new InvalidArgumentException(
                sprintf(
                    'Prioridade inválida: "%s". Valores aceitos: %s.',
                    $nivel,
                    implode(', ', array_keys(self::SLA_HORAS))
                )
            );
        }

        $this->nivel = $normalizado;
    }

    public static function deString(string $nivel): self
    {
        return new self($nivel);
    }

    public static function baixa(): self
    {
        return new self(self::BAIXA);
    }

    public static function media(): self
    {
        return new self(self::MEDIA);
    }

    public static function alta(): self
    {
        return new self(self::ALTA);
    }

    public static function urgente(): self
    {
        return new self(self::URGENTE);
    }

    public function valor(): string
    {
        return $this->nivel;
    }

    public function slaHoras(): int
    {
        return self::SLA_HORAS[$this->nivel];
    }

    public function slaFormatado(): string
    {
        return sprintf('%dh', $this->slaHoras());
    }

    public function multiplicador(): float
    {
        return self::MULTIPLICADORES_CUSTO[$this->nivel];
    }

    public function ehCritica(): bool
    {
        return in_array($this->nivel, [self::ALTA, self::URGENTE], true);
    }

    public function igualA(self $outra): bool
    {
        return $this->nivel === $outra->nivel;
    }

    public function __toString(): string
    {
        return $this->nivel;
    }

    private static function normalizar(string $entrada): string
    {
        $limpo = mb_strtolower(trim($entrada));
        return match ($limpo) {
            'baixa' => self::BAIXA,
            'media', 'média' => self::MEDIA,
            'alta' => self::ALTA,
            'urgente' => self::URGENTE,
            default => $entrada,
        };
    }
}
