<?php

declare(strict_types=1);

namespace App\Core\Domain\ACL;

final readonly class OrdemDespachoTecnicoDTO
{
    public function __construct(
        public string $codigoDespachoExterno,
        public string $referenciaOrdemCore,
        public string $identificacaoCliente,
        public string $escopoIntervencaoCampo,
        public string $nivelCriticidadeLogistica,
        public int $janelaAtendimentoMinutos,
        public ?int $identificadorRecursoCampo = null,
        public ?string $nomeEspecialistaDesignado = null,
        public ?string $categoriaHabilidade = null,
        public string $boundedContextOrigem = 'OrdensDeServicoCore',
        public string $boundedContextDestino = 'LogisticaDeCampoSupporting',
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'codigo_despacho_externo' => $this->codigoDespachoExterno,
            'referencia_ordem_core' => $this->referenciaOrdemCore,
            'identificacao_cliente' => $this->identificacaoCliente,
            'escopo_intervencao_campo' => $this->escopoIntervencaoCampo,
            'nivel_criticidade_logistica' => $this->nivelCriticidadeLogistica,
            'janela_atendimento_minutos' => $this->janelaAtendimentoMinutos,
            'identificador_recurso_campo' => $this->identificadorRecursoCampo,
            'nome_especialista_designado' => $this->nomeEspecialistaDesignado,
            'categoria_habilidade' => $this->categoriaHabilidade,
            'bounded_context_origem' => $this->boundedContextOrigem,
            'bounded_context_destino' => $this->boundedContextDestino,
        ];
    }
}
