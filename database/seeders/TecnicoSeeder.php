<?php

namespace Database\Seeders;

use App\Models\Tecnico;
use Illuminate\Database\Seeder;

class TecnicoSeeder extends Seeder
{
    public function run(): void
    {
        $tecnicos = [
            [
                'id' => 1,
                'nome' => 'Henrique Ricardo',
                'email' => 'henrique.ricardo@nexora.com',
                'telefone' => '(11) 98765-1001',
                'especialidade' => 'Eletromecânica & Geradores Industriais',
                'ativo' => true,
            ],
            [
                'id' => 2,
                'nome' => 'Felipe Carneiro',
                'email' => 'felipe.carneiro@nexora.com',
                'telefone' => '(11) 98765-1002',
                'especialidade' => 'Telecomunicações & Rastreamento Veicular',
                'ativo' => true,
            ],
            [
                'id' => 3,
                'nome' => 'Éden Samuel',
                'email' => 'eden.samuel@nexora.com',
                'telefone' => '(11) 98765-1003',
                'especialidade' => 'Redes Ópticas, Switching & Infraestrutura de TI',
                'ativo' => true,
            ],
            [
                'id' => 4,
                'nome' => 'Fernando Lopes',
                'email' => 'fernando.lopes@nexora.com',
                'telefone' => '(11) 98765-1004',
                'especialidade' => 'Automação Industrial, Refrigeração & Sensores IoT',
                'ativo' => true,
            ],
            [
                'id' => 5,
                'nome' => 'Hugo Takeda',
                'email' => 'hugo.takeda@nexora.com',
                'telefone' => '(11) 98765-1005',
                'especialidade' => 'Sistemas Embarcados, Biometria & Controle de Acesso',
                'ativo' => true,
            ],
        ];

        foreach ($tecnicos as $tec) {
            Tecnico::updateOrCreate(['email' => $tec['email']], $tec);
        }
    }
}
