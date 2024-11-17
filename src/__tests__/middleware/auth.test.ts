import { authenticate, authorize } from '../../middleware/auth';
import { TokenService } from '../../domain/services/token.service';
import { AuthenticationError, AuthorizationError } from '../../errors/application-errors';

describe('Auth Middleware', () => {
  let tokenService: jest.Mocked<TokenService>;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    tokenService = {
      verifyToken: jest.fn(),
    } as any;

    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      const mockPayload = {
        sub: '1',
        role: 'user',
        permissions: ['read:own'],
      };

      req.headers.authorization = 'Bearer valid-token';
      tokenService.verifyToken.mockResolvedValue(mockPayload);

      await authenticate(tokenService)(req, res, next);

      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should reject missing token', async () => {
      await authenticate(tokenService)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });
  });
});