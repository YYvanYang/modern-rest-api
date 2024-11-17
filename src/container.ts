import { Container } from 'typedi';
import { UserRepository } from './repositories/user.repository';
import { AuditRepository } from './repositories/audit.repository';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { TokenService } from './domain/services/token.service';
import { CacheService } from './infrastructure/cache/cache.service';
import { EmailService } from './infrastructure/email/email.service';
import { NotificationService } from './infrastructure/notification/notification.service';
import { UserEventHandler } from './events/handlers/user.handler';
import { redis } from './infrastructure/cache';

// Register services
Container.set('redis', redis);

Container.set(CacheService, new CacheService(redis));
Container.set(TokenService, new TokenService(redis));
Container.set(EmailService, new EmailService());
Container.set(NotificationService, new NotificationService());

// Register repositories
Container.set(UserRepository, new UserRepository());
Container.set(AuditRepository, new AuditRepository());

// Register business services
Container.set(UserService, new UserService(
  Container.get(UserRepository),
  Container.get(CacheService),
  Container.get(AuditRepository)
));

Container.set(AuthService, new AuthService(
  Container.get(UserRepository),
  Container.get(TokenService)
));

// Register event handlers
Container.set(UserEventHandler, new UserEventHandler(
  Container.get(EmailService),
  Container.get(NotificationService)
));

export { Container };