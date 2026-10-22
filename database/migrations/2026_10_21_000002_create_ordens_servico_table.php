<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordens_servico', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 50)->unique();
            $table->string('cliente');
            $table->text('servico');
            $table->foreignId('tecnico_id')->nullable()->constrained('tecnicos')->nullOnDelete();
            $table->string('tecnico_nome')->nullable();
            $table->enum('prioridade', ['Baixa', 'Média', 'Alta', 'Urgente'])->default('Média');
            $table->enum('situacao', ['Aberta', 'Agendada', 'Em execução', 'Concluída', 'Cancelada'])->default('Aberta');
            $table->decimal('valor_estimado', 10, 2)->default(0.00);
            $table->decimal('valor_final', 10, 2)->nullable();
            $table->text('observacoes')->nullable();
            $table->dateTime('data_agendamento')->nullable();
            $table->dateTime('data_conclusao')->nullable();
            $table->timestamps();

            $table->index(['situacao', 'prioridade']);
            $table->index('cliente');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ordens_servico');
    }
};
