export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}