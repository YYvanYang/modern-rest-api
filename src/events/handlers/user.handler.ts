import { EventTypes } from '../event-types';
import { eventEmitter } from '../event-emitter';
import { logger } from '../../infrastructure/logger';
import { EmailService } from '../../infrastructure/email/email.service';
import { NotificationService } from '../../infrastructure/notification/notification.service';

export class UserEventHandler {
  constructor(
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService
  ) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    eventEmitter.on(EventTypes.USER_CREATED, this.handleUserCreated.bind(this));
    eventEmitter.on(EventTypes.USER_EMAIL_CHANGED, this.handleEmailChanged.bind(this));
    eventEmitter.on(EventTypes.USER_PASSWORD_CHANGED, this.handlePasswordChanged.bind(this));
    eventEmitter.on(EventTypes.USER_LOGIN, this.handleUserLogin.bind(this));
  }

  private async handleUserCreated(data: { user: User }): Promise<void> {
    try {
      await this.emailService.sendWelcomeEmail(data.user.email);
      logger.info({ userId: data.user.id }, 'Welcome email sent to new user');
    } catch (error) {
      logger.error({ error, userId: data.user.id }, 'Failed to send welcome email');
    }
  }

  private async handleEmailChanged(data: {
    userId: string;
    oldEmail: string;
    newEmail: string;
  }): Promise<void> {
    try {
      await Promise.all([
        this.emailService.sendEmailChangeConfirmation(data.oldEmail),
        this.emailService.sendEmailChangeNotification(data.newEmail),
      ]);
      logger.info({ userId: data.userId }, 'Email change notifications sent');
    } catch (error) {
      logger.error(
        { error, userId: data.userId },
        'Failed to send email change notifications'
      );
    }
  }

  private async handlePasswordChanged(data: { userId: string }): Promise<void> {
    try {
      await this.notificationService.sendSecurityAlert(
        data.userId,
        'Your password has been changed'
      );
      logger.info({ userId: data.userId }, 'Password change notification sent');
    } catch (error) {
      logger.error(
        { error, userId: data.userId },
        'Failed to send password change notification'
      );
    }
  }

  private async handleUserLogin(data: {
    userId: string;
    ip: string;
    userAgent: string;
  }): Promise<void> {
    try {
      await this.notificationService.sendLoginAlert(
        data.userId,
        {
          ip: data.ip,
          userAgent: data.userAgent,
          timestamp: new Date(),
        }
      );
      logger.info({ userId: data.userId }, 'Login notification sent');
    } catch (error) {
      logger.error(
        { error, userId: data.userId },
        'Failed to send login notification'
      );
    }
  }
}