-- RiwiMediCare Plus PostgreSQL schema backup
-- Plain SQL backup. Restore with: psql -U <user> -d <database> -f database/backup.sql

BEGIN;

CREATE TYPE "enum_users_role" AS ENUM ('ADMIN', 'REQUEST_MANAGER');
CREATE TYPE "enum_supply_requests_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "role" "enum_users_role" NOT NULL DEFAULT 'REQUEST_MANAGER',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "clinics" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "nit" VARCHAR(255) NOT NULL UNIQUE,
  "responsibleUserId" INTEGER NOT NULL REFERENCES "users" ("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "warehouses" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "location" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "medicines" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "warehouse_medicines" (
  "id" SERIAL PRIMARY KEY,
  "warehouseId" INTEGER NOT NULL REFERENCES "warehouses" ("id"),
  "medicineId" INTEGER NOT NULL REFERENCES "medicines" ("id"),
  "stock" INTEGER NOT NULL CONSTRAINT "chk_warehouse_medicine_stock_non_negative" CHECK ("stock" >= 0),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE UNIQUE INDEX "warehouse_medicine_unique"
  ON "warehouse_medicines" ("warehouseId", "medicineId");

CREATE TABLE "supply_requests" (
  "id" SERIAL PRIMARY KEY,
  "clinicId" INTEGER NOT NULL REFERENCES "clinics" ("id"),
  "medicineId" INTEGER NOT NULL REFERENCES "medicines" ("id"),
  "warehouseId" INTEGER NOT NULL REFERENCES "warehouses" ("id"),
  "quantity" INTEGER NOT NULL CONSTRAINT "chk_supply_request_quantity_positive" CHECK ("quantity" > 0),
  "status" "enum_supply_requests_status" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

COMMIT;