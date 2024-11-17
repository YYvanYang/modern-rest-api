import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const existingRequestId = req.headers['x-request-id'];
  req.id = (existingRequestId as string) || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}