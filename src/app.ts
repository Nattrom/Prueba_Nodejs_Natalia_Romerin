import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database';
import './models';
import authRoutes from './routes/auth.routes';
import clinicRoutes from './routes/clinic.routes';
import warehouseRoutes from './routes/warehouse.routes';
import medicineRoutes from './routes/medicine.routes';
import warehouseMedicineRoutes from './routes/warehouseMedicine.routes';
import supplyRequestRoutes from './routes/supplyRequest.routes';
import seedRoutes from './routes/seed.routes';
import { config } from './config/environment';

const app = express();

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
  apis: ['./src/app.ts', './src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/warehouse-medicines', warehouseMedicineRoutes);
app.use('/api/supply-requests', supplyRequestRoutes);
app.use('/api/seed', seedRoutes);

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns the service health status and current timestamp.
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, timestamp]
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2026-08-31T12:00:00.000Z'
 */
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database connection and synchronization
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models (create tables if they don't exist)
    // Note: not using { alter: true } because it can create duplicate
    // unique constraints on repeated runs during development.
    await sequelize.sync();
    console.log('Database synchronized successfully.');

    // Add database-level CHECK constraints (idempotent)
    // These complement the application-level Sequelize validation.
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_warehouse_medicine_stock_non_negative'
        ) THEN
          ALTER TABLE "warehouse_medicines"
            ADD CONSTRAINT chk_warehouse_medicine_stock_non_negative
            CHECK (stock >= 0);
        END IF;
      END $$;
    `);

    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_supply_request_quantity_positive'
        ) THEN
          ALTER TABLE "supply_requests"
            ADD CONSTRAINT chk_supply_request_quantity_positive
            CHECK (quantity > 0);
        END IF;
      END $$;
    `);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Initialize database
initializeDatabase();

export default app;