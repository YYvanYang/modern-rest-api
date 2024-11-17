import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { BaseController } from './base.controller';
import { User } from '../domain/entities/user.entity';
import { logger } from '../infrastructure/logger';
import { metrics } from '../infrastructure/metrics';

export class UserController extends BaseController<User, string> {
  constructor(private readonly userService: UserService) {
    super(userService);
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user!.id;

      await this.userService.changePassword(userId, oldPassword, newPassword);
      
      logger.info({ userId }, 'Password changed successfully');
      metrics.increment('user.password_changes');

      res.status(200).json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async changeEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newEmail, password } = req.body;
      const userId = req.user!.id;

      await this.userService.changeEmail(userId, newEmail, password);
      
      logger.info({ userId }, 'Email changed successfully');
      metrics.increment('user.email_changes');

      res.status(200).json({
        message: 'Email changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const userId = req.params.id;
      const adminId = req.user!.id;

      await this.userService.changeStatus(userId, status, adminId);
      
      logger.info({ userId, adminId, status }, 'User status changed');
      metrics.increment('user.status_changes');

      res.status(200).json({
        message: 'User status changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}