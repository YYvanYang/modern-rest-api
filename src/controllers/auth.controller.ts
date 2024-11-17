import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../infrastructure/logger';
import { metrics } from '../infrastructure/metrics';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.authService.register(req.body);
      
      logger.info({ userId: user.id }, 'New user registered');
      metrics.increment('auth.registrations');

      res.status(201).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      
      logger.info({ userId: result.user.id }, 'User logged in');
      metrics.increment('auth.logins');

      res.json({
        data: result,
      });
    } catch (error) {
      metrics.increment('auth.login_failures');
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);

      logger.info({ userId: req.user?.id }, 'Token refreshed');
      metrics.increment('auth.token_refreshes');

      res.json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const tokenId = req.token!.jti;
      
      await this.authService.logout(userId, tokenId);
      
      logger.info({ userId }, 'User logged out');
      metrics.increment('auth.logouts');

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}