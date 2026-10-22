<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Domain\ACL\LogisticaAclTranslator;
use App\Core\Domain\Aggregates\OrdemServicoAggregate;
use App\Core\Domain\Entities\ItemServicoEntity;
use App\Core\Domain\Events\OrdemServicoCriada;
use App\Core\Domain\Events\TecnicoAtribuido;
use App\Core\Domain\ValueObjects\PrioridadeOrdem;
use App\Core\Domain\ValueObjects\StatusOrdem;
use App\Core\Domain\ValueObjects\ValorMonetario;
use App\Core\Infrastructure\EventStore\SqliteEventStore;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

final class DddAndEventSourcingTest extends TestCase
{
    use RefreshDatabase;

    public function test_valor_monetario_value_object_immutability_and_operations(): void
    {
        $valorBase = ValorMonetario::deReais(1850.00);
        $adicional = ValorMonetario::deCentavos(15000); // R$ 150,00

        $this->assertSame(185000, $valorBase->emCentavos());
        $this->assertSame(1850.00, $valorBase->emReais());
        $this->assertSame('R$ 1.850,00', $valorBase->formatar());
        $this->assertSame('BRL', $valorBase->moeda());

        $soma = $valorBase->somar($adicional);
        $this->assertSame(2000.00, $soma->emReais());
        $this->assertSame('R$ 2.000,00', (string) $soma);
        // Garante imutabilidade do objeto original
        $this->assertSame(1850.00, $valorBase->emReais());

        $comAcrescimo = $soma->aplicarPercentual(10.0);
        $this->assertSame(2200.00, $comAcrescimo->emReais());

        $this->expectException(InvalidArgumentException::class);
        ValorMonetario::deReais(-10.00);
    }

    public function test_prioridade_ordem_value_object_sla_and_multiplier(): void
    {
        $baixa = PrioridadeOrdem::baixa();
        $media = PrioridadeOrdem::media();
        $alta = PrioridadeOrdem::alta();
        $urgente = PrioridadeOrdem::urgente();

        $this->assertSame(72, $baixa->slaHoras());
        $this->assertSame('72h', $baixa->slaFormatado());
        $this->assertFalse($baixa->ehCritica());

        $this->assertSame(24, $media->slaHoras());
        $this->assertSame(1.00, $media->multiplicador());

        $this->assertSame(8, $alta->slaHoras());
        $this->assertSame(1.15, $alta->multiplicador());
        $this->assertTrue($alta->ehCritica());

        $this->assertSame(2, $urgente->slaHoras());
        $this->assertSame(1.35, $urgente->multiplicador());
        $this->assertTrue($urgente->ehCritica());

        $this->expectException(InvalidArgumentException::class);
        PrioridadeOrdem::deString('Inexistente');
    }

    public function test_status_ordem_state_machine_valid_and_invalid_transitions(): void
    {
        $status = StatusOrdem::aberta();
        $this->assertFalse($status->ehTerminal());

        $agendada = $status->transicionarPara(StatusOrdem::agendada());
        $this->assertSame('Agendada', $agendada->valor());

        $emExecucao = $agendada->transicionarPara(StatusOrdem::emExecucao());
        $this->assertSame('Em execução', $emExecucao->valor());

        $concluida = $emExecucao->transicionarPara(StatusOrdem::concluida());
        $this->assertTrue($concluida->ehTerminal());

        $this->expectException(DomainException::class);
        $concluida->transicionarPara(StatusOrdem::aberta());
    }

    public function test_anti_corruption_layer_translates_core_events_to_logistica_dto(): void
    {
        $eventoCriada = new OrdemServicoCriada(
            aggregateId: 'OS-7001',
            cliente: 'Hospital Sírio-Libanês',
            servico: 'Manutenção de Gerador Crítico de Emergência',
            prioridade: 'Urgente',
            valorEstimadoReais: 4200.00,
            valorEstimadoCentavos: 420000,
            slaHoras: 2,
            observacoes: 'Prioridade hospitalar máxima',
        );

        $eventoTecnico = new TecnicoAtribuido(
            aggregateId: 'OS-7001',
            tecnicoId: 1,
            tecnicoNome: 'Carlos Eduardo Mendes',
            especialidade: 'Geradores & Energia Crítica',
            novaSituacao: 'Agendada',
        );

        $translator = new LogisticaAclTranslator();
        $dto = $translator->traduzirParaDespacho($eventoCriada, $eventoTecnico);

        $this->assertSame('DSP-OS-7001', $dto->codigoDespachoExterno);
        $this->assertSame('OS-7001', $dto->referenciaOrdemCore);
        $this->assertSame('Hospital Sírio-Libanês', $dto->identificacaoCliente);
        $this->assertSame('CRITICA_IMEDIATA_P1', $dto->nivelCriticidadeLogistica);
        $this->assertSame(120, $dto->janelaAtendimentoMinutos);
        $this->assertSame(1, $dto->identificadorRecursoCampo);
        $this->assertSame('Carlos Eduardo Mendes', $dto->nomeEspecialistaDesignado);
        $this->assertSame('OrdensDeServicoCore', $dto->boundedContextOrigem);
        $this->assertSame('LogisticaDeCampoSupporting', $dto->boundedContextDestino);
    }

    public function test_event_sourcing_persistence_and_aggregate_state_replay(): void
    {
        $eventStore = new SqliteEventStore();

        $aggregate = OrdemServicoAggregate::criar(
            codigo: 'OS-8001',
            cliente: 'DataCenter Equinix SP3',
            servico: 'Substituição de Módulo Retificador UPS',
            prioridade: PrioridadeOrdem::alta(),
            valorEstimado: ValorMonetario::deReais(3600.00),
            observacoes: 'Acesso liberado na doca 4',
        );

        $aggregate->adicionarItem(new ItemServicoEntity(
            id: 'ITEM-01',
            descricao: 'Módulo Retificador 48V',
            quantidade: 2,
            valorUnitario: ValorMonetario::deReais(1800.00),
        ));

        $aggregate->atribuirTecnico(
            tecnicoId: 2,
            tecnicoNome: 'Mariana Costa Silva',
            especialidade: 'Sistemas Críticos UPS',
            novaSituacao: StatusOrdem::AGENDADA,
        );

        $aggregate->autorizarFaturamento(
            codigoAutorizacao: 'AUTH-EQX-8001',
            valorAutorizado: 3600.00,
        );

        $aggregate->concluir(
            valorFinal: 3850.00,
            laudoTecnico: 'Dois módulos substituídos e baterias equalizadas com sucesso.',
        );

        // Persiste os 4 eventos imutáveis no SqliteEventStore
        $eventStore->saveAggregate($aggregate);

        $storedEvents = $eventStore->getEventsForAggregate('OS-8001');
        $this->assertCount(4, $storedEvents);
        $this->assertSame('OrdemServicoCriada', $storedEvents[0]['event_type']);
        $this->assertSame(1, $storedEvents[0]['version']);
        $this->assertSame('TecnicoAtribuido', $storedEvents[1]['event_type']);
        $this->assertSame(2, $storedEvents[1]['version']);
        $this->assertSame('FaturamentoAutorizado', $storedEvents[2]['event_type']);
        $this->assertSame(3, $storedEvents[2]['version']);
        $this->assertSame('OrdemServicoConcluida', $storedEvents[3]['event_type']);
        $this->assertSame(4, $storedEvents[3]['version']);

        // Reconstrói o Aggregate Root do zero apenas via Replay de eventos!
        $replayed = $eventStore->loadAggregate('OS-8001');

        $this->assertSame('OS-8001', $replayed->codigo());
        $this->assertSame('DataCenter Equinix SP3', $replayed->cliente());
        $this->assertSame('Alta', $replayed->prioridade()->valor());
        $this->assertSame('Concluída', $replayed->status()->valor());
        $this->assertSame(3600.00, $replayed->valorEstimado()->emReais());
        $this->assertSame(3850.00, $replayed->valorFinal()?->emReais());
        $this->assertSame(2, $replayed->tecnicoId());
        $this->assertSame('Mariana Costa Silva', $replayed->tecnicoNome());
        $this->assertTrue($replayed->faturamentoAutorizado());
        $this->assertSame('AUTH-EQX-8001', $replayed->codigoAutorizacaoFaturamento());
        $this->assertSame(4, $replayed->version());
    }
}
