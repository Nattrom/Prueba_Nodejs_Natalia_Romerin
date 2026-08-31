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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
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

// Health check endpoint
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