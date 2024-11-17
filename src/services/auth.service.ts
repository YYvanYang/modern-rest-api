import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from '../domain/services/token.service';
import { LoginResult } from '../types/auth';
import { User, UserStatus } from '../domain/entities/user.entity';
import { 
  AuthenticationError, 
  ValidationError 
} from '../errors/application-errors';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.tokenService.generateTokens(user);

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async register(userData: {
    email: string;
    username: string;
    password: string;
  }): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
      role: 'user',
      status: UserStatus.ACTIVE,
    });

    return user;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const payload = await this.tokenService.verifyToken(refreshToken);
    if (payload.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    // Get user
    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Generate new access token
    const { accessToken } = await this.tokenService.generateTokens(user);

    return { accessToken };
  }

  async logout(userId: string, tokenId: string): Promise<void> {
    await this.tokenService.revokeToken(tokenId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
  }
}