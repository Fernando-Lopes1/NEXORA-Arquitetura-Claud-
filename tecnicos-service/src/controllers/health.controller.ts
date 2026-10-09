import { Request, Response } from 'express';
import { tecnicoRepository } from '../db/tecnico.repository';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    const health = await tecnicoRepository.checkHealth();
    res.status(200).json({
      status: 'UP',
      service: 'tecnicos-service',
      database: health.connected ? 'connected' : 'disconnected',
      provider: health.provider,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(200).json({
      status: 'UP',
      service: 'tecnicos-service',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
