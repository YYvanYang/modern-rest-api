import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/base.error';
import { logger } from '../infrastructure/logger';
import { config } from '../config';
import { ErrorResponse } from '../types/error';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void {
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
    },
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: req.id,
        path: req.path,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: req.id,
        path: req.path,
      },
    });
    return;
  }

  // Handle unexpected errors
  const internalError = {
    error: {
      code: 'INTERNAL_ERROR',
      message: config.app.env === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      details: config.app.env === 'production' ? undefined : err.stack,
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.id,
      path: req.path,
    },
  };

  res.status(500).json(internalError);
}