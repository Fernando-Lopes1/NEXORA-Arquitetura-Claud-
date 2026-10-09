import { Request, Response } from 'express';
import { ordemRepository } from '../db/ordem.repository';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    const health = await ordemRepository.checkHealth();
    res.status(200).json({
      status: 'UP',
      service: 'os-service',
      database: health.connected ? 'connected' : 'disconnected',
      provider: health.provider,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(200).json({
      status: 'UP',
      service: 'os-service',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
