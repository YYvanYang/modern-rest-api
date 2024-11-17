declare namespace Express {
  export interface Request {
    id: string;
    startTime: number;
    user?: {
      id: string;
      role: string;
      permissions: string[];
    };
    token?: {
      jti: string;
      type: 'access' | 'refresh';
    };
    context: {
      traceId: string;
      spanId: string;
      startTime: number;
    };
  }
}