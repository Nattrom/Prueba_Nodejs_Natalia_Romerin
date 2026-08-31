# RiwiMediCare Plus — Supply Request Management API

RiwiMediCare Plus is a REST API for coordinating medicine supply requests between clinics and warehouses. It centralizes users, clinics, medicines, warehouses, and warehouse inventory so clinics can request supplies with reliable stock validation. Requests are created as pending and inventory is only consumed when a request is approved.

## Main Features

- Public user registration and login.
- JWT Bearer authentication and role-based authorization.
- Clinic, warehouse, medicine, and warehouse inventory management.
- Supply request creation, status transitions, and request history.
- Inventory validation and transaction-based stock reduction on approval.
- Sequelize soft deletion for primary business entities.
- JSON seed upload with Multer memory storage.
- Swagger UI API documentation.
- Jest unit tests and coverage thresholds.
- Docker and Docker Compose support.

## Technologies

- Node.js
- TypeScript
- Express
- Sequelize
- PostgreSQL
- jsonwebtoken
- bcryptjs
- Multer
- Swagger JSDoc and Swagger UI Express
- Jest and ts-jest
- Docker and Docker Compose

## Architecture

The project follows a simple layered architecture:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Models
  ↓
PostgreSQL
```

- **Routes** define endpoint paths and apply authentication and role middleware.
- **Controllers** translate HTTP requests and responses without business rules.
- **Services** validate input and implement business rules, transactions, and database operations.
- **Models** define Sequelize entities, relationships, validations, and soft deletion.
- **PostgreSQL** persists application data.

Middleware is used for JWT authentication, role authorization, and JSON-only Multer file uploads.

## Project Structure

```text
src/
  config/        Environment and Sequelize configuration
  controllers/   HTTP request and response handling
  middlewares/   JWT, role, and upload middleware
  models/        Sequelize models and relationships
  routes/        Express routes and OpenAPI JSDoc annotations
  services/      Business rules and database operations
  types/         Shared TypeScript declarations
  app.ts         Express application and database initialization
  server.ts      HTTP server startup
tests/           Jest unit and authorization middleware tests
Dockerfile       Production multi-stage API image
docker-compose.yml API and PostgreSQL services
```

## Database Model

The database contains six entities:

- **User**: application account with an `ADMIN` or `REQUEST_MANAGER` role.
- **Clinic**: a clinic identified by a unique NIT and assigned responsible user.
- **Warehouse**: a physical medicine storage location.
- **Medicine**: a medicine catalog entry.
- **WarehouseMedicine**: the inventory record for one medicine in one warehouse.
- **SupplyRequest**: a clinic request for a medicine from a warehouse.

`WarehouseMedicine` stores stock because a medicine can have a different quantity in each warehouse. The relationship is:

```text
Warehouse + Medicine → WarehouseMedicine → stock
```

The composite unique constraint `(warehouseId, medicineId)` prevents duplicate inventory records for the same warehouse and medicine.

## Authentication and Authorization

Registration and login are public. Passwords are hashed with `bcryptjs`; a successful login returns a signed JWT containing `id`, `email`, and `role`. Protected endpoints require the header:

```http
Authorization: Bearer <token>
```

| Area | ADMIN | REQUEST_MANAGER |
| --- | --- | --- |
| Clinics | Full CRUD | No access |
| Warehouses | Full CRUD | No access |
| Medicines | Full CRUD | No access |
| Warehouse medicines | Full CRUD | No access |
| Seed upload | Allowed | No access |
| Supply requests | Create, read, and update status | Create, read active/history/by ID, and update status |

## Supply Request Business Rules

### Request Creation

Creating a request verifies that the clinic, medicine, and warehouse exist and are active; quantity is an integer greater than zero; the `WarehouseMedicine` inventory relation exists; and current stock is sufficient. The request is created with `PENDING` status. Stock is **not** reserved or reduced at creation.

### Approval

The transition `PENDING → APPROVED` runs in a Sequelize transaction. The inventory row is locked, stock is checked again, stock is reduced atomically, and the request status is updated. Any failure rolls back the transaction.

### Other Transitions

- `PENDING → REJECTED` consumes no stock.
- `APPROVED → COMPLETED` performs no additional stock operation.
- Any transition outside these rules is rejected.

## Soft Deletion

`User`, `Clinic`, `Warehouse`, `Medicine`, and `SupplyRequest` use Sequelize paranoid mode. Deleted records are retained in the database but excluded from ordinary queries. `WarehouseMedicine` is intentionally not paranoid because it is an inventory association record rather than a primary business entity.

## Seed Upload

The seed endpoint accepts an administrator-provided JSON file rather than using hard-coded data. This implementation fulfills the endpoint-based seeding requirement and additionally provides input validation and transactional rollback.

`POST /api/seed/upload` is protected by JWT and restricted to the `ADMIN` role. Submit `multipart/form-data` with a JSON file in the `file` field. Multer handles the upload using memory storage, validates it as JSON, and limits files to 5 MB.

The file is processed transactionally in dependency order: `Users → Clinics → Warehouses → Medicines → WarehouseMedicines`. Later records can safely reference records created earlier in the same file.

```json
{
  "users": [{ "name": "Admin User", "email": "admin@example.com", "password": "secure123", "role": "ADMIN" }],
  "clinics": [{ "name": "Central Clinic", "nit": "900123456-7", "responsibleUserEmail": "admin@example.com" }],
  "warehouses": [{ "name": "Main Warehouse", "location": "Barranquilla" }],
  "medicines": [{ "name": "Paracetamol", "description": "Analgesic" }],
  "warehouseMedicines": [{ "warehouseName": "Main Warehouse", "medicineName": "Paracetamol", "stock": 100 }]
}
```

## API Endpoints

| Method | Route | Authentication / Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a user |
| POST | `/api/auth/login` | Public | Login and obtain a JWT |
| POST | `/api/clinics` | JWT / ADMIN | Create a clinic |
| GET | `/api/clinics` | JWT / ADMIN | List clinics |
| GET | `/api/clinics/:id` | JWT / ADMIN | Get a clinic |
| PUT | `/api/clinics/:id` | JWT / ADMIN | Update a clinic |
| DELETE | `/api/clinics/:id` | JWT / ADMIN | Soft delete a clinic |
| POST | `/api/warehouses` | JWT / ADMIN | Create a warehouse |
| GET | `/api/warehouses` | JWT / ADMIN | List warehouses |
| GET | `/api/warehouses/:id` | JWT / ADMIN | Get a warehouse |
| PUT | `/api/warehouses/:id` | JWT / ADMIN | Update a warehouse |
| DELETE | `/api/warehouses/:id` | JWT / ADMIN | Soft delete a warehouse |
| POST | `/api/medicines` | JWT / ADMIN | Create a medicine |
| GET | `/api/medicines` | JWT / ADMIN | List medicines |
| GET | `/api/medicines/:id` | JWT / ADMIN | Get a medicine |
| PUT | `/api/medicines/:id` | JWT / ADMIN | Update a medicine |
| DELETE | `/api/medicines/:id` | JWT / ADMIN | Soft delete a medicine |
| POST | `/api/warehouse-medicines` | JWT / ADMIN | Create inventory |
| GET | `/api/warehouse-medicines` | JWT / ADMIN | List inventory |
| GET | `/api/warehouse-medicines/:id` | JWT / ADMIN | Get inventory |
| PUT | `/api/warehouse-medicines/:id` | JWT / ADMIN | Update inventory |
| DELETE | `/api/warehouse-medicines/:id` | JWT / ADMIN | Delete inventory |
| POST | `/api/supply-requests` | JWT / ADMIN or REQUEST_MANAGER | Create a request |
| GET | `/api/supply-requests` | JWT / ADMIN | List all requests |
| GET | `/api/supply-requests/active` | JWT / ADMIN or REQUEST_MANAGER | List pending and approved requests |
| GET | `/api/supply-requests/history/:clinicId` | JWT / ADMIN or REQUEST_MANAGER | Get a clinic request history |
| GET | `/api/supply-requests/:id` | JWT / ADMIN or REQUEST_MANAGER | Get a request |
| PUT | `/api/supply-requests/:id/status` | JWT / ADMIN or REQUEST_MANAGER | Update request status |
| POST | `/api/seed/upload` | JWT / ADMIN | Upload seed JSON |
| GET | `/health` | Public | Check API health |

## Environment Variables

Copy the example file and replace placeholder values in your local `.env` file:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `PORT` | HTTP server port, default `3000` |
| `NODE_ENV` | Application environment |
| `DB_HOST` | PostgreSQL hostname (`localhost` locally, `postgres` in Compose) |
| `DB_PORT` | PostgreSQL port |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password; use a local secret |
| `JWT_SECRET` | Secret used to sign JWTs; use a strong local secret |
| `JWT_EXPIRES_IN` | JWT lifetime, for example `24h` |
| `SWAGGER_TITLE` | Swagger API title |
| `SWAGGER_VERSION` | Swagger API version |
| `SWAGGER_DESCRIPTION` | Swagger API description |

Never commit `.env` or production credentials.

## Installation and Local Development

```bash
git clone https://github.com/Nattrom/Prueba_Nodejs_Natalia_Romerin.git
cd Prueba_Nodejs_Natalia_Romerin
npm install
cp .env.example .env
npm run dev
```

For local PostgreSQL, configure `DB_HOST=localhost` and the port exposed by your PostgreSQL installation or container. The application connects and synchronizes its Sequelize models at startup.

## Production Build

```bash
npm run build
npm start
```

## Testing

```bash
npm test
npm test -- --coverage --runInBand
```

The project enforces a global coverage threshold above 40% for statements, branches, functions, and lines.

## Docker

Docker Compose starts separate API and PostgreSQL containers:

```bash
docker compose build
docker compose up -d
docker compose ps
```

The API connects to PostgreSQL through the internal `riwimedicare-network` using the hostname `postgres`. PostgreSQL data is persisted in the named `postgres_data` volume. PostgreSQL uses `pg_isready` as a health check, and the API waits for that health check before startup.

```bash
docker compose logs -f api
docker compose down
```

The API is available at `http://localhost:3000`.

## Swagger

Open Swagger UI at:

```text
http://localhost:3000/api/docs
```

Swagger documents the implemented routes, request bodies, responses, and JWT Bearer authentication.

## Git Workflow

```text
main
  ↑
develop
  ↑
feature/*
```

Develop features in `feature/*` branches, merge verified work into `develop`, and promote `develop` to `main` after final verification.

## Conventional Commits

Examples from this project:

```text
feat(auth): add JWT authentication and role-based authorization
feat(clinics): add admin-only clinic CRUD with soft delete
feat(docker): add Docker Compose support for API and PostgreSQL
test: add service unit tests
docs(swagger): document API endpoints
```

## Author

- Coder: Natalia Romerin Rincon
- Clan: Clan de NODE.JS/NEXT
- Repository: https://github.com/Nattrom/Prueba_Nodejs_Natalia_Romerin
