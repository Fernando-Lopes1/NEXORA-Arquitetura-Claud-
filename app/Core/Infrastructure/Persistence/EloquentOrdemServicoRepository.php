<?php

declare(strict_types=1);

namespace App\Core\Infrastructure\Persistence;

use App\Core\Application\Contracts\OrdemServicoReaderInterface;
use App\Core\Application\Contracts\OrdemServicoWriterInterface;
use App\Models\OrdemServico;
use Illuminate\Support\Collection;

/**
 * ISP, LSP & DIP: Eloquent repository implementing segregated Reader and Writer contracts.
 */
final class EloquentOrdemServicoRepository implements OrdemServicoReaderInterface, OrdemServicoWriterInterface
{
    public function findById(int $id): ?OrdemServico
    {
        return OrdemServico::with(['tecnico', 'itens'])->find($id);
    }

    public function findByCodigo(string $codigo): ?OrdemServico
    {
        return OrdemServico::with(['tecnico', 'itens'])->where('codigo', $codigo)->first();
    }

    public function findByIdOrCodigo(int|string $identifier): ?OrdemServico
    {
        if (is_numeric($identifier)) {
            $byId = $this->findById((int) $identifier);
            if ($byId !== null) {
                return $byId;
            }
        }

        return $this->findByCodigo((string) $identifier);
    }

    public function listAll(array $filters = []): Collection
    {
        $query = OrdemServico::with(['tecnico', 'itens']);

        if (!empty($filters['status']) && $filters['status'] !== 'Todos') {
            $query->where('situacao', $filters['status']);
        }

        if (!empty($filters['situacao']) && $filters['situacao'] !== 'Todos') {
            $query->where('situacao', $filters['situacao']);
        }

        if (!empty($filters['prioridade']) && $filters['prioridade'] !== 'Todas') {
            $query->where('prioridade', $filters['prioridade']);
        }

        if (!empty($filters['tecnico_id'])) {
            $query->where('tecnico_id', (int) $filters['tecnico_id']);
        }

        $search = $filters['busca'] ?? $filters['q'] ?? null;
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                    ->orWhere('cliente', 'like', "%{$search}%")
                    ->orWhere('servico', 'like', "%{$search}%")
                    ->orWhere('tecnico_nome', 'like', "%{$search}%");
            });
        }

        return $query->orderByDesc('id')->get();
    }

    public function create(array $attributes): OrdemServico
    {
        return OrdemServico::create($attributes);
    }

    public function save(OrdemServico $ordem): OrdemServico
    {
        $ordem->save();
        return $ordem->fresh(['tecnico', 'itens']) ?? $ordem;
    }

    public function delete(int|string $identifier): bool
    {
        $ordem = $this->findByIdOrCodigo($identifier);
        if ($ordem === null) {
            return false;
        }

        return (bool) $ordem->delete();
    }
}
