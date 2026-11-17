<?php

namespace Database\Seeders;

use App\Models\OrdemServico;
use App\Models\Tecnico;
use Illuminate\Database\Seeder;

class OrdemServicoSeeder extends Seeder
{
    public function run(): void
    {
        $henrique = Tecnico::where('nome', 'Henrique Ricardo')->first();
        $felipe   = Tecnico::where('nome', 'Felipe Carneiro')->first();
        $fernando = Tecnico::where('nome', 'Fernando Lopes')->first();
        $hugo     = Tecnico::where('nome', 'Hugo Takeda')->first();

        $ordens = [
            [
                'codigo' => 'OS-1001',
                'cliente' => 'Hospital Central São Lucas',
                'servico' => 'Manutenção preventiva em gerador principal',
                'tecnico_id' => $henrique?->id,
                'tecnico_nome' => $henrique?->nome ?? 'Henrique Ricardo',
                'prioridade' => OrdemServico::PRIORIDADE_ALTA,
                'situacao' => OrdemServico::STATUS_EM_EXECUCAO,
                'valor_estimado' => 1850.00,
                'valor_final' => null,
                'observacoes' => 'Atendimento crítico em unidade hospitalar de alta complexidade. Substituição preventiva de fluidos.',
                'data_agendamento' => '2026-10-02 08:00:00',
                'itens' => [
                    ['descricao' => 'Kit de filtros de óleo e combustível para gerador diesel', 'quantidade' => 2, 'valor_unitario' => 225.00, 'valor_total' => 450.00],
                    ['descricao' => 'Fluido de arrefecimento orgânico industrial e teste em banco de carga', 'quantidade' => 1, 'valor_unitario' => 600.00, 'valor_total' => 600.00],
                    ['descricao' => 'Mão de obra técnica especializada em geradores de emergência', 'quantidade' => 1, 'valor_unitario' => 800.00, 'valor_total' => 800.00],
                ],
            ],
            [
                'codigo' => 'OS-1002',
                'cliente' => 'Logística TransBrasil S.A.',
                'servico' => 'Instalação de rastreadores em frota de caminhões',
                'tecnico_id' => $felipe?->id,
                'tecnico_nome' => $felipe?->nome ?? 'Felipe Carneiro',
                'prioridade' => OrdemServico::PRIORIDADE_MEDIA,
                'situacao' => OrdemServico::STATUS_AGENDADA,
                'valor_estimado' => 920.00,
                'valor_final' => null,
                'observacoes' => 'Instalação de telemetria CAN bus em 2 carretas pesadas no pátio de Santos.',
                'data_agendamento' => '2026-10-02 14:00:00',
                'itens' => [
                    ['descricao' => 'Módulo telemático GPS/4G homologado Anatel', 'quantidade' => 2, 'valor_unitario' => 310.00, 'valor_total' => 620.00],
                    ['descricao' => 'Calibração de sensores e configuração do gateway veicular', 'quantidade' => 1, 'valor_unitario' => 300.00, 'valor_total' => 300.00],
                ],
            ],
            [
                'codigo' => 'OS-1003',
                'cliente' => 'Escola Técnica Politécnica',
                'servico' => 'Substituição de switch de rede principal',
                'tecnico_id' => null,
                'tecnico_nome' => 'Não atribuído',
                'prioridade' => OrdemServico::PRIORIDADE_BAIXA,
                'situacao' => OrdemServico::STATUS_ABERTA,
                'valor_estimado' => 450.00,
                'valor_final' => null,
                'observacoes' => 'Aguardando alocação de técnico especialista em redes para troca física de rack no bloco B.',
                'data_agendamento' => null,
                'itens' => [
                    ['descricao' => 'Patch cords Cat6 Furukawa homologados e organizador de cabos', 'quantidade' => 1, 'valor_unitario' => 150.00, 'valor_total' => 150.00],
                    ['descricao' => 'Configuração lógica de trunking, VLANs pedagógicas e administrativas', 'quantidade' => 1, 'valor_unitario' => 300.00, 'valor_total' => 300.00],
                ],
            ],
            [
                'codigo' => 'OS-1004',
                'cliente' => 'Supermercados Alvorada Ltda.',
                'servico' => 'Reparo emergencial em compressores de câmara fria',
                'tecnico_id' => $fernando?->id,
                'tecnico_nome' => $fernando?->nome ?? 'Fernando Lopes',
                'prioridade' => OrdemServico::PRIORIDADE_URGENTE,
                'situacao' => OrdemServico::STATUS_CONCLUIDA,
                'valor_estimado' => 2400.00,
                'valor_final' => 2400.00,
                'observacoes' => 'Atendimento emergencial concluído com sucesso, evitando perda de perecíveis.',
                'data_agendamento' => '2026-10-03 09:00:00',
                'data_conclusao' => '2026-10-03 16:30:00',
                'itens' => [
                    ['descricao' => 'Válvula de expansão termostática Danfoss e filtro secador', 'quantidade' => 2, 'valor_unitario' => 450.00, 'valor_total' => 900.00],
                    ['descricao' => 'Carga de gás refrigerante ecológico R-404A e teste de estanqueidade', 'quantidade' => 1, 'valor_unitario' => 500.00, 'valor_total' => 500.00],
                    ['descricao' => 'Mão de obra de urgência e calibragem dos controladores digitais', 'quantidade' => 1, 'valor_unitario' => 1000.00, 'valor_total' => 1000.00],
                ],
            ],
            [
                'codigo' => 'OS-1005',
                'cliente' => 'Condomínio Residencial Parque das Flores',
                'servico' => 'Manutenção do sistema de interfonia e controle biométrico',
                'tecnico_id' => $hugo?->id,
                'tecnico_nome' => $hugo?->nome ?? 'Hugo Takeda',
                'prioridade' => OrdemServico::PRIORIDADE_MEDIA,
                'situacao' => OrdemServico::STATUS_CONCLUIDA,
                'valor_estimado' => 680.00,
                'valor_final' => 680.00,
                'observacoes' => 'Substituição de leitor facial da portaria central e recadastramento de biometrias.',
                'data_agendamento' => '2026-10-04 10:00:00',
                'data_conclusao' => '2026-10-04 12:45:00',
                'itens' => [
                    ['descricao' => 'Terminal de reconhecimento facial IP anti-fraude', 'quantidade' => 1, 'valor_unitario' => 480.00, 'valor_total' => 480.00],
                    ['descricao' => 'Sincronização de base de dados de moradores e backup em nuvem', 'quantidade' => 1, 'valor_unitario' => 200.00, 'valor_total' => 200.00],
                ],
            ],
        ];

        foreach ($ordens as $dados) {
            $itens = $dados['itens'];
            unset($dados['itens']);

            $ordem = OrdemServico::updateOrCreate(['codigo' => $dados['codigo']], $dados);

            $ordem->itens()->delete();
            foreach ($itens as $item) {
                $ordem->itens()->create($item);
            }
        }
    }
}
