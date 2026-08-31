# RiwiMediCare Plus API

Backend API for RiwiMediCare Plus medicine supply management system.

## Coder

Natalia Romerin

## Clan

[Your Clan Name Here]

## Technologies

- Node.js 18+
- TypeScript
- Express
- PostgreSQL
- Sequelize ORM
- JSON Web Token (JWT)
- Multer (file uploads)
- Swagger JSDoc + Swagger UI
- bcrypt (password hashing)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Nattrom/Prueba_Nodejs_Natalia_Romerin.git
cd Prueba_Nodejs_Natalia_Romerin
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your PostgreSQL credentials and JWT secret.

4. Set up PostgreSQL database (choose one option):

**Option A - Docker (recommended):**
```bash
docker run -d --name riwimedicare-postgres \
  -e POSTGRES_DB=riwimedicare_plus \
  -e POSTGRES_USER=riwi_user \
  -e POSTGRES_PASSWORD=riwi_password \
  -p 5435:5432 \
  -v riwimedicare_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```
Then set `DB_PORT=5435` in your `.env` file.

**Option B - Native PostgreSQL:**
```sql
CREATE DATABASE riwimedicare_plus;
CREATE USER riwi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE riwimedicare_plus TO riwi_user;
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRATION`: JWT token expiration time

## Running the Application

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## Run with Docker

Docker Compose starts the API and PostgreSQL together. The API uses `postgres` as the database hostname inside Docker. Local development can continue using `localhost` in `.env`.

```bash
docker compose build
docker compose up -d
```

The default development database values are defined in `.env.example`. You can override `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `JWT_SECRET` through your shell environment or a local `.env` file. Do not use development credentials in production.

## Check Containers

```bash
docker compose ps
```

## View API Logs

```bash
docker compose logs -f api
```

## Stop Containers

```bash
docker compose down
```

The named `postgres_data` volume persists the database when containers are stopped with `docker compose down`.

## API

```
http://localhost:3000
```

## API Documentation

Once the server is running, access Swagger UI at:
```
http://localhost:3000/api/docs
```

## Health Check

Verify the server is running:
```bash
curl http://localhost:3000/health
```