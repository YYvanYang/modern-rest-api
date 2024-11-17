import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from '../docs/openapi';
import { config } from '../config';

const router = Router();

if (config.app.env !== 'production') {
  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(openApiDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation',
  }));
}

export { router as docsRouter };