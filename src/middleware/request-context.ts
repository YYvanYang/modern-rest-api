import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import cls from 'cls-hooked';

const nsid = 'request-context';
export const ns = cls.createNamespace(nsid);

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  ns.run(() => {
    ns.set('traceId', req.id);
    ns.set('spanId', uuidv4());
    ns.set('startTime', Date.now());
    next();
  });
}