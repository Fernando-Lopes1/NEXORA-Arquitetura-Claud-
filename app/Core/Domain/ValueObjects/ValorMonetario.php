<?php

declare(strict_types=1);

namespace App\Core\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class ValorMonetario
{
    private int $centavos;
    private string $moeda;

    private function __construct(int $centavos, string $moeda = 'BRL')
    {
        if ($centavos < 0) {
            throw new InvalidArgumentException(
                sprintf('Valor monetário não pode ser negativo: %d centavos informado.', $centavos)
            );
        }

        $this->centavos = $centavos;
        $this->moeda = strtoupper($moeda);
    }

    public static function deReais(float|int|string $valorReais, string $moeda = 'BRL'): self
    {
        $valorNumerico = (float) $valorReais;
        if ($valorNumerico < 0) {
            throw new InvalidArgumentException(
                sprintf('Valor monetário em reais não pode ser negativo: %.2f', $valorNumerico)
            );
        }

        $centavos = (int) round($valorNumerico * 100);
        return new self($centavos, $moeda);
    }

    public static function deCentavos(int $centavos, string $moeda = 'BRL'): self
    {
        return new self($centavos, $moeda);
    }

    public static function zero(string $moeda = 'BRL'): self
    {
        return new self(0, $moeda);
    }

    public function emCentavos(): int
    {
        return $this->centavos;
    }

    public function emReais(): float
    {
        return round($this->centavos / 100, 2);
    }

    public function moeda(): string
    {
        return $this->moeda;
    }

    public function somar(self $outro): self
    {
        $this->validarMesmaMoeda($outro);
        return new self($this->centavos + $outro->centavos, $this->moeda);
    }

    public function subtrair(self $outro): self
    {
        $this->validarMesmaMoeda($outro);
        $resultado = $this->centavos - $outro->centavos;
        if ($resultado < 0) {
            throw new InvalidArgumentException('Resultado da subtração monetária não pode ser negativo.');
        }

        return new self($resultado, $this->moeda);
    }

    public function multiplicarPorFator(float $fator): self
    {
        if ($fator < 0) {
            throw new InvalidArgumentException('Fator de multiplicação não pode ser negativo.');
        }

        $novosCentavos = (int) round($this->centavos * $fator);
        return new self($novosCentavos, $this->moeda);
    }

    public function aplicarPercentual(float $percentual): self
    {
        $fator = 1 + ($percentual / 100.0);
        if ($fator < 0) {
            throw new InvalidArgumentException('Desconto percentual não pode exceder 100%.');
        }

        return $this->multiplicarPorFator($fator);
    }

    public function maiorQue(self $outro): bool
    {
        $this->validarMesmaMoeda($outro);
        return $this->centavos > $outro->centavos;
    }

    public function igualA(self $outro): bool
    {
        return $this->moeda === $outro->moeda && $this->centavos === $outro->centavos;
    }

    public function formatar(): string
    {
        return 'R$ ' . number_format($this->emReais(), 2, ',', '.');
    }

    public function __toString(): string
    {
        return $this->formatar();
    }

    private function validarMesmaMoeda(self $outro): void
    {
        if ($this->moeda !== $outro->moeda) {
            throw new InvalidArgumentException(
                sprintf('Operação inválida entre moedas distintas: %s e %s.', $this->moeda, $outro->moeda)
            );
        }
    }
}
