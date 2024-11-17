import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../domain/services/token.service';
import { AuthenticationError, AuthorizationError } from '../errors/application-errors';

export function authenticate(tokenService: TokenService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new AuthenticationError('No token provided');
      }

      const token = authHeader.split(' ')[1];
      const payload = await tokenService.verifyToken(token);

      req.user = {
        id: payload.sub,
        role: payload.role,
        permissions: payload.permissions,
      };

      next();
    } catch (error) {
      next(new AuthenticationError('Invalid token'));
    }
  };
}

export function authorize(permissions: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    // Check if user has admin permissions
    if (req.user.permissions.includes('*')) {
      return next();
    }

    // Check specific permissions
    const hasPermission = requiredPermissions.every(permission =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      throw new AuthorizationError('Insufficient permissions');
    }

    next();
  };
}