declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: {
        id: string;
        role: string;
        permissions: string[];
      };
      context: {
        traceId: string;
        spanId: string;
        startTime: number;
      };
    }
  }
}