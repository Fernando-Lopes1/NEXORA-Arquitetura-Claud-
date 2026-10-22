<?php

declare(strict_types=1);

namespace App\Core\Domain\ACL;

use App\Core\Domain\Events\OrdemServicoCriada;
use App\Core\Domain\Events\TecnicoAtribuido;

/**
 * Anti-Corruption Layer (ACL) Translator (Slide 45 - ASC14).
 *
 * Isola o Bounded Context de Logística de Campo (Supporting Domain) do modelo
 * de domínio interno do Bounded Context de Ordens de Serviço (Core Domain),
 * traduzindo Eventos de Domínio para a Linguagem Ubíqua de Despacho de Campo.
 */
final class LogisticaAclTranslator
{
    public function traduzirParaDespacho(
        OrdemServicoCriada $eventoCriacao,
        ?TecnicoAtribuido $eventoAlocacao = null,
    ): OrdemDespachoTecnicoDTO {
        $nivelCriticidade = match ($eventoCriacao->prioridade) {
            'Urgente' => 'CRITICA_IMEDIATA_P1',
            'Alta' => 'ALTA_PRIORIDADE_P2',
            'Média' => 'NORMAL_PROGRAMADA_P3',
            default => 'ROTINA_BAIXA_P4',
        };

        $janelaMinutos = $eventoCriacao->slaHoras * 60;

        return new OrdemDespachoTecnicoDTO(
            codigoDespachoExterno: 'DSP-' . $eventoCriacao->aggregateId(),
            referenciaOrdemCore: $eventoCriacao->aggregateId(),
            identificacaoCliente: $eventoCriacao->cliente,
            escopoIntervencaoCampo: $eventoCriacao->servico,
            nivelCriticidadeLogistica: $nivelCriticidade,
            janelaAtendimentoMinutos: $janelaMinutos,
            identificadorRecursoCampo: $eventoAlocacao?->tecnicoId,
            nomeEspecialistaDesignado: $eventoAlocacao?->tecnicoNome,
            categoriaHabilidade: $eventoAlocacao?->especialidade,
        );
    }
}
