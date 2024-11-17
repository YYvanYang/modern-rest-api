import 'dotenv/config';
import { App } from './app';
import { logger } from './infrastructure/logger';
import { config } from './config';

async function bootstrap() {
  try {
    const app = new App();
    await app.start();

    logger.info({
      env: config.app.env,
      version: process.env.npm_package_version,
      nodeVersion: process.version,
    }, '📦 Application bootstrap completed');

  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Unknown error'),
      '🔥 Failed to start application'
    );
    process.exit(1);
  }
}

// 启动应用
bootstrap().catch((error) => {
  logger.error(error, '🔥 Unhandled error during bootstrap');
  process.exit(1);
});
