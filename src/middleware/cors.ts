import cors from 'cors';
import { config } from '../config';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || config.cors.origins.includes('*')) {
      callback(null, true);
      return;
    }
    
    if (config.cors.origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: config.cors.methods,
  credentials: true,
  maxAge: 86400, // 24 hours
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
});