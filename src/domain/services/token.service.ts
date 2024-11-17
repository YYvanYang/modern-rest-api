import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { TokenPayload } from '../../types/auth';
import { User } from '../entities/user.entity';

export class TokenService {
  constructor(private readonly redis: Redis) {}

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenId = uuidv4();
    const refreshTokenId = uuidv4();

    const accessToken = await this.generateAccessToken(user, accessTokenId);
    const refreshToken = await this.generateRefreshToken(user, refreshTokenId);

    // Store token IDs in Redis for blacklisting
    await this.redis.setex(
      `token:access:${accessTokenId}`,
      config.auth.accessTokenTTL,
      user.id
    );
    await this.redis.setex(
      `token:refresh:${refreshTokenId}`,
      config.auth.refreshTokenTTL,
      user.id
    );

    return { accessToken, refreshToken };
  }

  private async generateAccessToken(user: User, tokenId: string): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      role: user.role,
      permissions: await this.getUserPermissions(user),
      type: 'access',
      jti: tokenId,
    };

    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiresIn,
      algorithm: 'HS256',
    });
  }

  private async generateRefreshToken(user: User, tokenId: string): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      role: user.role,
      permissions: [],
      type: 'refresh',
      jti: tokenId,
    };

    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.refreshTokenExpiresIn,
      algorithm: 'HS256',
    });
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as TokenPayload;

    // Check if token is blacklisted
    const isBlacklisted = await this.redis.exists(`token:blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    return decoded;
  }

  async revokeToken(tokenId: string): Promise<void> {
    // Add token to blacklist
    await this.redis.setex(
      `token:blacklist:${tokenId}`,
      config.auth.jwtExpiresIn,
      '1'
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const pattern = `token:*:${userId}`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private async getUserPermissions(user: User): Promise<string[]> {
    // 这里可以从数据库或配置中加载用户权限
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'],
      user: ['read:own', 'write:own'],
    };
    
    return rolePermissions[user.role] || [];
  }
}