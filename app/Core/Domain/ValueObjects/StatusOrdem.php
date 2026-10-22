<?php

declare(strict_types=1);

namespace App\Core\Domain\ValueObjects;

use DomainException;
use InvalidArgumentException;

final readonly class StatusOrdem
{
    public const ABERTA = 'Aberta';
    public const AGENDADA = 'Agendada';
    public const EM_EXECUCAO = 'Em execução';
    public const CONCLUIDA = 'Concluída';
    public const CANCELADA = 'Cancelada';

    private const TRANSICOES_VALIDAS = [
        self::ABERTA => [self::AGENDADA, self::EM_EXECUCAO, self::CANCELADA],
        self::AGENDADA => [self::EM_EXECUCAO, self::CONCLUIDA, self::CANCELADA],
        self::EM_EXECUCAO => [self::CONCLUIDA, self::CANCELADA],
        self::CONCLUIDA => [],
        self::CANCELADA => [],
    ];

    private string $estado;

    private function __construct(string $estado)
    {
        $normalizado = self::normalizar($estado);
        if (!array_key_exists($normalizado, self::TRANSICOES_VALIDAS)) {
            throw new InvalidArgumentException(
                sprintf(
                    'Status de Ordem de Serviço inválido: "%s". Valores permitidos: %s.',
                    $estado,
                    implode(', ', array_keys(self::TRANSICOES_VALIDAS))
                )
            );
        }

        $this->estado = $normalizado;
    }

    public static function deString(string $estado): self
    {
        return new self($estado);
    }

    public static function aberta(): self
    {
        return new self(self::ABERTA);
    }

    public static function agendada(): self
    {
        return new self(self::AGENDADA);
    }

    public static function emExecucao(): self
    {
        return new self(self::EM_EXECUCAO);
    }

    public static function concluida(): self
    {
        return new self(self::CONCLUIDA);
    }

    public static function cancelada(): self
    {
        return new self(self::CANCELADA);
    }

    public function valor(): string
    {
        return $this->estado;
    }

    public function podeTransicionarPara(self $novoStatus): bool
    {
        if ($this->estado === $novoStatus->estado) {
            return true;
        }

        return in_array($novoStatus->estado, self::TRANSICOES_VALIDAS[$this->estado], true);
    }

    public function transicionarPara(self $novoStatus): self
    {
        if (!$this->podeTransicionarPara($novoStatus)) {
            throw new DomainException(
                sprintf(
                    'Transição de estado inválida para Ordem de Serviço: de "%s" para "%s".',
                    $this->estado,
                    $novoStatus->estado
                )
            );
        }

        return $novoStatus;
    }

    public function ehTerminal(): bool
    {
        return in_array($this->estado, [self::CONCLUIDA, self::CANCELADA], true);
    }

    public function igualA(self $outro): bool
    {
        return $this->estado === $outro->estado;
    }

    public function __toString(): string
    {
        return $this->estado;
    }

    private static function normalizar(string $entrada): string
    {
        $limpo = mb_strtolower(trim($entrada));
        return match ($limpo) {
            'aberta' => self::ABERTA,
            'agendada' => self::AGENDADA,
            'em execução', 'em execucao', 'em_andamento', 'em andamento' => self::EM_EXECUCAO,
            'concluída', 'concluida' => self::CONCLUIDA,
            'cancelada' => self::CANCELADA,
            default => $entrada,
        };
    }
}
