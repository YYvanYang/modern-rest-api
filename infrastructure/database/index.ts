import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../../config';
import { logger } from '../logger';

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.username,
  password: config.db.password,
  database: config.db.database,
  max: config.db.maxConnections,
  idleTimeoutMillis: config.db.idleTimeout,
  application_name: config.app.name,
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

export const db = drizzle(pool);