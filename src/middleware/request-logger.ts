import { Request, Response, NextFunction } from 'express';
import { logger } from '../infrastructure/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Log request
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    requestId: req.id,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      type: 'response',
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      requestId: req.id,
    });
  });

  next();
}