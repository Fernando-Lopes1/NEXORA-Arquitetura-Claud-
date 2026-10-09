import { Request, Response } from 'express';
import { ordemRepository } from '../db/ordem.repository';
import {
  PrioridadeOS,
  StatusOS,
  VALID_PRIORIDADES,
  VALID_STATUSES
} from '../models/OrdemServico';
import { LifecycleValidator } from '../services/lifecycle.validator';

export async function listOrdens(req: Request, res: Response): Promise<void> {
  try {
    const filter = {
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      prioridade: typeof req.query.prioridade === 'string' ? req.query.prioridade : undefined,
      cliente: typeof req.query.cliente === 'string' ? req.query.cliente : undefined
    };

    const ordens = await ordemRepository.findAll(filter);
    res.status(200).json(ordens);
  } catch (error: any) {
    console.error('Erro ao listar ordens de serviço:', error);
    res.status(500).json({ erro: `Erro ao listar ordens de serviço: ${error.message}` });
  }
}

export async function getOrdemById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      res.status(400).json({ erro: 'ID inválido. Deve ser um número inteiro positivo.' });
      return;
    }

    const ordem = await ordemRepository.findById(id);
    if (!ordem) {
      res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
      return;
    }

    res.status(200).json(ordem);
  } catch (error: any) {
    console.error('Erro ao buscar ordem de serviço:', error);
    res.status(500).json({ erro: `Erro ao buscar ordem de serviço: ${error.message}` });
  }
}

export async function createOrdem(req: Request, res: Response): Promise<void> {
  try {
    const { cliente, descricao, prazo } = req.body;
    const prioridade = req.body.prioridade || 'Média';
    const status = req.body.status || 'Aberta';
    const valor_estimado = req.body.valor_estimado !== undefined ? Number(req.body.valor_estimado) : 0;
    const tecnico = req.body.tecnico || req.body.tecnico_atribuido || null;

    // 1. Campo cliente obrigatório
    if (!cliente || typeof cliente !== 'string' || cliente.trim().length === 0) {
      res.status(400).json({ erro: "O campo 'cliente' é obrigatório." });
      return;
    }

    // 2. Campo descricao obrigatório
    if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
      res.status(400).json({ erro: "O campo 'descricao' é obrigatório." });
      return;
    }

    // 3. Validação de prioridade
    if (!VALID_PRIORIDADES.includes(prioridade as PrioridadeOS)) {
      res.status(400).json({
        erro: `Prioridade inválida: '${prioridade}'. Valores permitidos: ${VALID_PRIORIDADES.join(', ')}.`
      });
      return;
    }

    // 4. Validação de status
    if (!VALID_STATUSES.includes(status as StatusOS)) {
      res.status(400).json({
        erro: `Status inválido: '${status}'. Valores permitidos: ${VALID_STATUSES.join(', ')}.`
      });
      return;
    }

    // 5. Validação de valor_estimado
    if (isNaN(valor_estimado) || valor_estimado < 0) {
      res.status(400).json({
        erro: "O campo 'valor_estimado' deve ser um número maior ou igual a zero."
      });
      return;
    }

    // 6. Regra de negócio: se status inicial for Agendada, Em Execução ou Concluída, técnico é obrigatório
    const cleanTecnico = tecnico && typeof tecnico === 'string' && tecnico.trim().length > 0 ? tecnico.trim() : null;
    if (['Agendada', 'Em Execução', 'Concluída'].includes(status) && !cleanTecnico) {
      res.status(400).json({
        erro: `Técnico responsável é obrigatório para ordens com status '${status}'.`
      });
      return;
    }

    const novaOrdem = await ordemRepository.create({
      cliente: cliente.trim(),
      descricao: descricao.trim(),
      tecnico: cleanTecnico,
      prioridade: prioridade as PrioridadeOS,
      status: status as StatusOS,
      valor_estimado,
      prazo: prazo || null
    });

    res.status(201).json(novaOrdem);
  } catch (error: any) {
    console.error('Erro ao cadastrar ordem de serviço:', error);
    res.status(500).json({ erro: `Erro ao criar ordem de serviço: ${error.message}` });
  }
}

export async function updateOrdem(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      res.status(400).json({ erro: 'ID inválido. Deve ser um número inteiro positivo.' });
      return;
    }

    const existing = await ordemRepository.findById(id);
    if (!existing) {
      res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
      return;
    }

    const { cliente, descricao, prioridade, status, valor_estimado, prazo } = req.body;
    const tecnico = req.body.tecnico !== undefined ? req.body.tecnico : req.body.tecnico_atribuido;

    if (cliente !== undefined && (typeof cliente !== 'string' || cliente.trim().length === 0)) {
      res.status(400).json({ erro: "O campo 'cliente' não pode ser vazio." });
      return;
    }

    if (descricao !== undefined && (typeof descricao !== 'string' || descricao.trim().length === 0)) {
      res.status(400).json({ erro: "O campo 'descricao' não pode ser vazio." });
      return;
    }

    if (prioridade !== undefined && !VALID_PRIORIDADES.includes(prioridade as PrioridadeOS)) {
      res.status(400).json({
        erro: `Prioridade inválida: '${prioridade}'. Valores permitidos: ${VALID_PRIORIDADES.join(', ')}.`
      });
      return;
    }

    if (valor_estimado !== undefined) {
      const numValor = Number(valor_estimado);
      if (isNaN(numValor) || numValor < 0) {
        res.status(400).json({
          erro: "O campo 'valor_estimado' deve ser um número maior ou igual a zero."
        });
        return;
      }
    }

    // Se houver alteração de status, validar transição de ciclo de vida
    if (status !== undefined && status !== existing.status) {
      if (!VALID_STATUSES.includes(status as StatusOS)) {
        res.status(400).json({
          erro: `Status inválido: '${status}'. Valores permitidos: ${VALID_STATUSES.join(', ')}.`
        });
        return;
      }

      const effectiveTecnico = tecnico !== undefined
        ? (tecnico ? String(tecnico).trim() : null)
        : existing.tecnico;

      const lifecycleResult = LifecycleValidator.validateTransition(
        existing.status,
        status as StatusOS,
        effectiveTecnico
      );

      if (!lifecycleResult.valid) {
        res.status(400).json({ erro: lifecycleResult.error });
        return;
      }
    }

    const updated = await ordemRepository.update(id, {
      cliente: cliente !== undefined ? cliente.trim() : undefined,
      descricao: descricao !== undefined ? descricao.trim() : undefined,
      tecnico: tecnico !== undefined ? (tecnico ? String(tecnico).trim() : null) : undefined,
      prioridade: prioridade as PrioridadeOS | undefined,
      status: status as StatusOS | undefined,
      valor_estimado: valor_estimado !== undefined ? Number(valor_estimado) : undefined,
      prazo: prazo !== undefined ? (prazo ? String(prazo).trim() : null) : undefined
    });

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar ordem de serviço:', error);
    res.status(500).json({ erro: `Erro ao atualizar ordem de serviço: ${error.message}` });
  }
}

export async function deleteOrdem(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      res.status(400).json({ erro: 'ID inválido. Deve ser um número inteiro positivo.' });
      return;
    }

    const existing = await ordemRepository.findById(id);
    if (!existing) {
      res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
      return;
    }

    const deleted = await ordemRepository.delete(id);
    if (!deleted) {
      res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
      return;
    }

    res.status(200).json({
      message: 'Ordem de serviço removida com sucesso.',
      id
    });
  } catch (error: any) {
    console.error('Erro ao excluir ordem de serviço:', error);
    res.status(500).json({ erro: `Erro ao remover ordem de serviço: ${error.message}` });
  }
}

export async function updateOrdemStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      res.status(400).json({ erro: 'ID inválido. Deve ser um número inteiro positivo.' });
      return;
    }

    const { status } = req.body;
    const tecnico = req.body.tecnico !== undefined ? req.body.tecnico : req.body.tecnico_atribuido;

    if (!status || !VALID_STATUSES.includes(status as StatusOS)) {
      res.status(400).json({
        erro: `Status inválido: '${status}'. Valores permitidos: ${VALID_STATUSES.join(', ')}.`
      });
      return;
    }

    const existing = await ordemRepository.findById(id);
    if (!existing) {
      res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
      return;
    }

    const effectiveTecnico = tecnico !== undefined
      ? (tecnico && String(tecnico).trim().length > 0 ? String(tecnico).trim() : null)
      : existing.tecnico;

    const lifecycleResult = LifecycleValidator.validateTransition(
      existing.status,
      status as StatusOS,
      effectiveTecnico
    );

    if (!lifecycleResult.valid) {
      res.status(400).json({ erro: lifecycleResult.error });
      return;
    }

    const updated = await ordemRepository.updateStatus(
      id,
      status as StatusOS,
      tecnico !== undefined ? effectiveTecnico : undefined
    );

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar status da ordem de serviço:', error);
    res.status(500).json({ erro: `Erro ao atualizar status da ordem: ${error.message}` });
  }
}
