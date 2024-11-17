import { Router } from 'express';
import { Container } from '../container';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { docsRouter } from './docs.routes';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limiter';

export const router = Router();

// Public routes
router.use('/auth', rateLimiter, authRouter);
router.use('/docs', docsRouter);

// Protected routes
router.use('/users', authenticate, userRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
});