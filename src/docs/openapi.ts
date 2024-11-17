import { OpenAPIObject } from 'openapi3-ts/oas31';
import { createApiDescription } from '@anatine/zod-openapi';
import { LoginSchema, RegisterSchema } from '../schemas/auth.schema';
import { insertUserSchema, updateUserSchema } from '../db/schema';

export const openApiDocument: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Modern REST API',
    version: '1.0.0',
    description: 'A modern RESTful API with complete features',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: createApiDescription(RegisterSchema),
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
          400: {
            $ref: '#/components/responses/ValidationError',
          },
        },
      },
    },
    // ... More path definitions
  },
  components: {
    schemas: {
      User: createApiDescription(insertUserSchema.omit({ password: true })),
      UpdateUser: createApiDescription(updateUserSchema),
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
            required: ['code', 'message'],
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    responses: {
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      // ... More response definitions
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};