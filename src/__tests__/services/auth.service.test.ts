import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../domain/services/token.service';
import { UserRepository } from '../../repositories/user.repository';
import { AuthenticationError } from '../../errors/application-errors';
import { UserStatus } from '../../domain/entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      updateLastLogin: jest.fn(),
    } as any;

    tokenService = {
      generateTokens: jest.fn(),
      verifyToken: jest.fn(),
    } as any;

    authService = new AuthService(userRepository, tokenService);
  });

  describe('login', () => {
    it('should authenticate valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        status: UserStatus.ACTIVE,
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      tokenService.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should reject invalid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow(AuthenticationError);
    });
  });
});