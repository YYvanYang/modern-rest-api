import { User, UserStatus } from '../domain/entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { BaseService } from './base.service';
import { ValidationError } from '../errors/application-errors';
import { EventTypes } from '../events/event-types';
import bcrypt from 'bcryptjs';

export class UserService extends BaseService<User, string> {
  constructor(
    private readonly userRepository: UserRepository,
    cacheService: CacheService,
    auditRepository: AuditRepository
  ) {
    super(userRepository, cacheService, auditRepository, 'user');
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.update(userId, { password: hashedPassword }, userId);

    await eventEmitter.emit(EventTypes.USER_PASSWORD_CHANGED, {
      userId,
      timestamp: new Date(),
    });
  }

  async changeEmail(
    userId: string,
    newEmail: string,
    password: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Password is incorrect');
    }

    const emailExists = await this.userRepository.findByEmail(newEmail);
    if (emailExists) {
      throw new ValidationError('Email already exists');
    }

    await this.update(userId, { email: newEmail }, userId);

    await eventEmitter.emit(EventTypes.USER_EMAIL_CHANGED, {
      userId,
      oldEmail: user.email,
      newEmail,
      timestamp: new Date(),
    });
  }

  async changeStatus(
    userId: string,
    status: UserStatus,
    adminId: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    await this.update(userId, { status }, adminId);

    await eventEmitter.emit(`user.status_changed`, {
      userId,
      oldStatus: user.status,
      newStatus: status,
      changedBy: adminId,
      timestamp: new Date(),
    });
  }
}