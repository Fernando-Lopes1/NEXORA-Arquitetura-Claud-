<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrdemServicoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'codigo' => ['nullable', 'string', 'max:50', 'unique:ordens_servico,codigo'],
            'cliente' => ['required', 'string', 'min:3', 'max:191'],
            'servico' => ['required', 'string', 'min:3'],
            'tecnico_id' => ['nullable', 'integer', 'exists:tecnicos,id'],
            'tecnico' => ['nullable', 'string', 'max:191'],
            'prioridade' => ['nullable', 'string', Rule::in(['Baixa', 'Média', 'Alta', 'Urgente'])],
            'situacao' => ['nullable', 'string', Rule::in(['Aberta', 'Agendada', 'Em execução', 'Concluída', 'Cancelada'])],
            'valor_estimado' => ['nullable', 'numeric', 'min:0'],
            'valorEstimado' => ['nullable', 'numeric', 'min:0'],
            'observacoes' => ['nullable', 'string', 'max:2000'],
            'itens' => ['nullable', 'array'],
        ];
    }
}
