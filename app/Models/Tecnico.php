<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tecnico extends Model
{
    use HasFactory;

    protected $table = 'tecnicos';

    protected $fillable = [
        'nome',
        'email',
        'telefone',
        'especialidade',
        'ativo',
    ];

    protected $casts = [
        'ativo' => 'boolean',
    ];

    public function ordensServico(): HasMany
    {
        return $this->hasMany(OrdemServico::class, 'tecnico_id');
    }

    public function scopeAtivos($query)
    {
        return $query->where('ativo', true);
    }
}
