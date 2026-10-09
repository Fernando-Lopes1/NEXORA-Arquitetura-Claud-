import { Request, Response } from 'express';
import { tecnicoRepository } from '../db/tecnico.repository';
import {
  EspecialidadeTecnico,
  StatusDisponibilidade,
  VALID_ESPECIALIDADES,
  VALID_DISPONIBILIDADES,
  EMAIL_REGEX,
  TecnicoFilter
} from '../models/Tecnico';

/**
 * GET /api/tecnicos
 * Lista técnicos com suporte a filtros por especialidade, regiao e status
 */
export async function listTecnicos(req: Request, res: Response): Promise<void> {
  try {
    const filter: TecnicoFilter = {
      especialidade: typeof req.query.especialidade === 'string' ? req.query.especialidade : undefined,
      regiao: typeof req.query.regiao === 'string' ? req.query.regiao : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined
    };

    const tecnicos = await tecnicoRepository.findAll(filter);
    res.status(200).json(tecnicos);
  } catch (error: any) {
    console.error('Erro ao listar técnicos:', error);
    res.status(500).json({ erro: `Erro ao listar técnicos: ${error.message}` });
  }
}

/**
 * GET /api/tecnicos/:id
 * Detalha um técnico por ID
 */
export async function getTecnicoById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      res.status(400).json({ erro: 'ID inválido. Deve ser um número inteiro positivo.' });
      return;
    }

    const tecnico = await tecnicoRepository.findById(id);
    if (!tecnico) {
      res.status(404).json({ erro: 'Técnico não encontrado.' });
      return;
    }

    res.status(200).json(tecnico);
  } catch (error: any) {
    console.error('Erro ao buscar técnico:', error);
    res.status(500).json({ erro: `Erro ao buscar técnico: ${error.message}` });
  }
}

/**
 * POST /api/tecnicos
 * Cadastra um novo técnico de campo com validação estrita
 */
export async function createTecnico(req: Request, res: Response): Promise<void> {
  try {
    const { nome, especialidade, telefone, email, regiao, status } = req.body;

    // 1. Validação de campo 'nome' obrigatório
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      res.status(400).json({ erro: "O campo 'nome' é obrigatório e não pode ser vazio." });
      return;
    }

    // 2. Validação de campo 'especialidade' obrigatório e pertencente ao enum
    if (
      !especialidade ||
      typeof especialidade !== 'string' ||
      !VALID_ESPECIALIDADES.includes(especialidade.trim() as EspecialidadeTecnico)
    ) {
      res.status(400).json({
        erro: `Especialidade inválida: '${especialidade}'. Valores permitidos: ${VALID_ESPECIALIDADES.join(', ')}.`
      });
      return;
    }

    // 3. Validação de formato de 'email' se fornecido
    if (email !== undefined && email !== null && String(email).trim().length > 0) {
      const cleanEmail = String(email).trim();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        res.status(400).json({
          erro: "E-mail inválido. Forneça um endereço de e-mail no formato válido (ex: tecnico@empresa.com)."
        });
        return;
      }
    }

    // 4. Validação e default para 'status' (default: "Disponível")
    let finalStatus: StatusDisponibilidade = 'Disponível';
    if (status !== undefined && status !== null && String(status).trim().length > 0) {
      const cleanStatus = String(status).trim() as StatusDisponibilidade;
      if (!VALID_DISPONIBILIDADES.includes(cleanStatus)) {
        res.status(400).json({
          erro: `Status de disponibilidade inválido: '${status}'. Valores permitidos: ${VALID_DISPONIBILIDADES.join(', ')}.`
        });
        return;
      }
      finalStatus = cleanStatus;
    }

    const novoTecnico = await tecnicoRepository.create({
      nome: nome.trim(),
      especialidade: especialidade.trim() as EspecialidadeTecnico,
      telefone: telefone && String(telefone).trim() ? String(telefone).trim() : null,
      email: email && String(email).trim() ? String(email).trim() : null,
      regiao: regiao && String(regiao).trim() ? String(regiao).trim() : null,
      status: finalStatus
    });

    res.status(201).json(novoTecnico);
  } catch (error: any) {
    console.error('Erro ao cadastrar técnico:', error);
    res.status(500).json({ erro: `Erro ao criar técnico: ${error.message}` });
  }
}

/**
 * PUT /api/tecnicos/:id
 * Atualiza os dados cadastrais de um técnico existente
 */
export async function updateTecnico(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      res.status(400).json({ erro: 'ID inválido. Deve ser um número inteiro positivo.' });
      return;
    }

    const existing = await tecnicoRepository.findById(id);
    if (!existing) {
      res.status(404).json({ erro: 'Técnico não encontrado.' });
      return;
    }

    const { nome, especialidade, telefone, email, regiao, status } = req.body;

    // Validação de nome se enviado
    if (nome !== undefined && (typeof nome !== 'string' || nome.trim().length === 0)) {
      res.status(400).json({ erro: "O campo 'nome' não pode ser vazio." });
      return;
    }

    // Validação de especialidade se enviada
    if (
      especialidade !== undefined &&
      (typeof especialidade !== 'string' || !VALID_ESPECIALIDADES.includes(especialidade.trim() as EspecialidadeTecnico))
    ) {
      res.status(400).json({
        erro: `Especialidade inválida: '${especialidade}'. Valores permitidos: ${VALID_ESPECIALIDADES.join(', ')}.`
      });
      return;
    }

    // Validação de e-mail se enviado e não vazio
    if (email !== undefined && email !== null && String(email).trim().length > 0) {
      const cleanEmail = String(email).trim();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        res.status(400).json({
          erro: "E-mail inválido. Forneça um endereço de e-mail no formato válido (ex: tecnico@empresa.com)."
        });
        return;
      }
    }

    // Validação de status se enviado
    if (
      status !== undefined &&
      (typeof status !== 'string' || !VALID_DISPONIBILIDADES.includes(status.trim() as StatusDisponibilidade))
    ) {
      res.status(400).json({
        erro: `Status de disponibilidade inválido: '${status}'. Valores permitidos: ${VALID_DISPONIBILIDADES.join(', ')}.`
      });
      return;
    }

    const updated = await tecnicoRepository.update(id, {
      nome: nome !== undefined ? String(nome).trim() : undefined,
      especialidade: especialidade !== undefined ? (String(especialidade).trim() as EspecialidadeTecnico) : undefined,
      telefone: telefone !== undefined ? (telefone && String(telefone).trim() ? String(telefone).trim() : null) : undefined,
      email: email !== undefined ? (email && String(email).trim() ? String(email).trim() : null) : undefined,
      regiao: regiao !== undefined ? (regiao && String(regiao).trim() ? String(regiao).trim() : null) : undefined,
      status: status !== undefined ? (String(status).trim() as StatusDisponibilidade) : undefined
    });

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar técnico:', error);
    res.status(500).json({ erro: `Erro ao atualizar técnico: ${error.message}` });
  }
}

/**
 * DELETE /api/tecnicos/:id
 * Remove um técnico cadastrado
 */
export async function deleteTecnico(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      res.status(400).json({ erro: 'ID inválido. Deve ser um número inteiro positivo.' });
      return;
    }

    const existing = await tecnicoRepository.findById(id);
    if (!existing) {
      res.status(404).json({ erro: 'Técnico não encontrado.' });
      return;
    }

    const deleted = await tecnicoRepository.delete(id);
    if (!deleted) {
      res.status(404).json({ erro: 'Técnico não encontrado.' });
      return;
    }

    res.status(200).json({
      message: 'Técnico removido com sucesso.',
      id
    });
  } catch (error: any) {
    console.error('Erro ao excluir técnico:', error);
    res.status(500).json({ erro: `Erro ao remover técnico: ${error.message}` });
  }
}

/**
 * PATCH /api/tecnicos/:id/disponibilidade
 * Altera status de disponibilidade (Disponível, Em Atendimento, Ausente)
 */
export async function updateDisponibilidade(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      res.status(400).json({ erro: 'ID inválido. Deve ser um número inteiro positivo.' });
      return;
    }

    const rawStatus = req.body.status !== undefined ? req.body.status : req.body.disponibilidade;

    if (
      !rawStatus ||
      typeof rawStatus !== 'string' ||
      !VALID_DISPONIBILIDADES.includes(rawStatus.trim() as StatusDisponibilidade)
    ) {
      res.status(400).json({
        erro: `Status de disponibilidade inválido: '${rawStatus}'. Valores permitidos: ${VALID_DISPONIBILIDADES.join(', ')}.`
      });
      return;
    }

    const existing = await tecnicoRepository.findById(id);
    if (!existing) {
      res.status(404).json({ erro: 'Técnico não encontrado.' });
      return;
    }

    const updated = await tecnicoRepository.updateDisponibilidade(id, rawStatus.trim() as StatusDisponibilidade);
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar disponibilidade do técnico:', error);
    res.status(500).json({ erro: `Erro ao atualizar disponibilidade do técnico: ${error.message}` });
  }
}
