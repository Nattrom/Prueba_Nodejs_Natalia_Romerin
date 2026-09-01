import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config/environment';

const fileExtension = __filename.endsWith('.ts') ? 'ts' : 'js';
const applicationDirectory = path.resolve(__dirname, '..');

/**
 * Central OpenAPI configuration. The runtime extension selects source JSDoc
 * during development and compiled JSDoc from dist/routes in production.
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: config.swagger.title,
      version: config.swagger.version,
      description: config.swagger.description,
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste only the value of data.token. Swagger adds the Bearer prefix automatically.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['ADMIN', 'REQUEST_MANAGER'], example: 'ADMIN' },
          },
        },
        Clinic: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Central Medical Clinic' },
            nit: { type: 'string', example: '900123456-7' },
            responsibleUserId: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Warehouse: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Main Warehouse' },
            location: { type: 'string', example: 'Barranquilla' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Medicine: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Paracetamol' },
            description: { type: 'string', nullable: true, example: 'Analgesic and antipyretic medication' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        WarehouseMedicine: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            warehouseId: { type: 'integer', example: 1 },
            medicineId: { type: 'integer', example: 1 },
            stock: { type: 'integer', minimum: 0, example: 100 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SupplyRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            clinicId: { type: 'integer', example: 1 },
            medicineId: { type: 'integer', example: 1 },
            warehouseId: { type: 'integer', example: 1 },
            quantity: { type: 'integer', example: 50 },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'], example: 'PENDING' },
            notes: { type: 'string', nullable: true, example: 'Urgent supply needed' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Invalid clinic ID' },
          },
          required: ['message'],
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
          required: ['token', 'user'],
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'secure123' },
            role: { type: 'string', enum: ['ADMIN', 'REQUEST_MANAGER'], example: 'ADMIN' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'secure123' },
          },
        },
        CreateClinicRequest: {
          type: 'object',
          required: ['name', 'nit', 'responsibleUserId'],
          properties: {
            name: { type: 'string', example: 'Central Medical Clinic' },
            nit: { type: 'string', example: '900123456-7' },
            responsibleUserId: { type: 'integer', example: 1 },
          },
        },
        CreateWarehouseRequest: {
          type: 'object',
          required: ['name', 'location'],
          properties: {
            name: { type: 'string', example: 'Main Warehouse' },
            location: { type: 'string', example: 'Barranquilla' },
          },
        },
        CreateMedicineRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Paracetamol' },
            description: { type: 'string', nullable: true, example: 'Analgesic and antipyretic medication' },
          },
        },
        CreateWarehouseMedicineRequest: {
          type: 'object',
          required: ['warehouseId', 'medicineId', 'stock'],
          properties: {
            warehouseId: { type: 'integer', example: 1 },
            medicineId: { type: 'integer', example: 1 },
            stock: { type: 'integer', minimum: 0, example: 100 },
          },
        },
        CreateSupplyRequest: {
          type: 'object',
          required: ['clinicId', 'medicineId', 'warehouseId', 'quantity'],
          properties: {
            clinicId: { type: 'integer', example: 1 },
            medicineId: { type: 'integer', example: 1 },
            warehouseId: { type: 'integer', example: 1 },
            quantity: { type: 'integer', minimum: 1, example: 50 },
            notes: { type: 'string', nullable: true, example: 'Urgent supply needed' },
          },
        },
        UpdateSupplyRequestStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'], example: 'APPROVED' },
          },
        },
      },
    },
  },
  apis: [
    path.join(applicationDirectory, `app.${fileExtension}`),
    path.join(applicationDirectory, `routes/*.${fileExtension}`),
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
