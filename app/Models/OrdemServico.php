<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrdemServico extends Model
{
    use HasFactory;

    protected $table = 'ordens_servico';

    public const STATUS_ABERTA = 'Aberta';
    public const STATUS_AGENDADA = 'Agendada';
    public const STATUS_EM_EXECUCAO = 'Em execução';
    public const STATUS_CONCLUIDA = 'Concluída';
    public const STATUS_CANCELADA = 'Cancelada';

    public const PRIORIDADE_BAIXA = 'Baixa';
    public const PRIORIDADE_MEDIA = 'Média';
    public const PRIORIDADE_ALTA = 'Alta';
    public const PRIORIDADE_URGENTE = 'Urgente';

    protected $fillable = [
        'codigo',
        'cliente',
        'servico',
        'tecnico_id',
        'tecnico_nome',
        'prioridade',
        'situacao',
        'valor_estimado',
        'valor_final',
        'observacoes',
        'data_agendamento',
        'data_conclusao',
    ];

    protected $casts = [
        'valor_estimado' => 'decimal:2',
        'valor_final' => 'decimal:2',
        'data_agendamento' => 'datetime',
        'data_conclusao' => 'datetime',
    ];

    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(Tecnico::class, 'tecnico_id');
    }

    public function itens(): HasMany
    {
        return $this->hasMany(ItemServico::class, 'ordem_servico_id');
    }

    public function scopePorStatus($query, ?string $status)
    {
        if ($status && $status !== 'Todos') {
            return $query->where('situacao', $status);
        }
        return $query;
    }

    public function scopePorPrioridade($query, ?string $prioridade)
    {
        if ($prioridade && $prioridade !== 'Todas') {
            return $query->where('prioridade', $prioridade);
        }
        return $query;
    }

    public function scopeEmAndamento($query)
    {
        return $query->whereIn('situacao', [self::STATUS_ABERTA, self::STATUS_AGENDADA, self::STATUS_EM_EXECUCAO]);
    }

    public function scopeConcluidas($query)
    {
        return $query->where('situacao', self::STATUS_CONCLUIDA);
    }

    public function atribuirTecnico(Tecnico $tecnico): self
    {
        $this->tecnico_id = $tecnico->id;
        $this->tecnico_nome = $tecnico->nome;
        if ($this->situacao === self::STATUS_ABERTA) {
            $this->situacao = self::STATUS_AGENDADA;
            $this->data_agendamento = now();
        }
        $this->save();
        return $this;
    }

    public function iniciarExecucao(): self
    {
        $this->situacao = self::STATUS_EM_EXECUCAO;
        $this->save();
        return $this;
    }

    public function concluir(?float $valorFinal = null): self
    {
        $this->situacao = self::STATUS_CONCLUIDA;
        $this->valor_final = $valorFinal ?? $this->valor_estimado;
        $this->data_conclusao = now();
        $this->save();
        return $this;
    }

    public function cancelar(?string $motivo = null): self
    {
        $this->situacao = self::STATUS_CANCELADA;
        if ($motivo) {
            $this->observacoes = ($this->observacoes ? $this->observacoes . "\n" : '') . 'Cancelamento: ' . $motivo;
        }
        $this->save();
        return $this;
    }
}
