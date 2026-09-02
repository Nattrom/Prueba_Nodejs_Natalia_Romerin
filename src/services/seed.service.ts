import bcrypt from 'bcryptjs';
import { Transaction } from 'sequelize';
import sequelize from '../config/database';
import User, { UserRole } from '../models/user.model';
import Clinic from '../models/clinic.model';
import Warehouse from '../models/warehouse.model';
import Medicine from '../models/medicine.model';
import WarehouseMedicine from '../models/warehouseMedicine.model';

const MIN_PASSWORD_LENGTH = 6;
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Seed file payload types
 */
export interface SeedUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface SeedClinicPayload {
  name: string;
  nit: string;
  responsibleUserEmail: string;
}

export interface SeedWarehousePayload {
  name: string;
  location: string;
}

export interface SeedMedicinePayload {
  name: string;
  description?: string | null;
}

export interface SeedWarehouseMedicinePayload {
  warehouseName: string;
  medicineName: string;
  stock: number;
}

export interface SeedFilePayload {
  users?: SeedUserPayload[];
  clinics?: SeedClinicPayload[];
  warehouses?: SeedWarehousePayload[];
  medicines?: SeedMedicinePayload[];
  warehouseMedicines?: SeedWarehouseMedicinePayload[];
}

export interface SeedResult {
  message: string;
  created: {
    users: number;
    clinics: number;
    warehouses: number;
    medicines: number;
    warehouseMedicines: number;
  };
}

interface SeedError extends Error {
  statusCode: number;
}

const makeSeedError = (message: string, statusCode: number): SeedError => {
  const error = new Error(message) as SeedError;
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/**
 * Parse and validate uploaded JSON file.
 */
const parseJsonFile = (fileBuffer: Buffer): SeedFilePayload => {
  let jsonData: unknown;

  try {
    const jsonString = fileBuffer.toString('utf-8');
    jsonData = JSON.parse(jsonString);
  } catch (error) {
    throw makeSeedError('Uploaded file contains invalid JSON', 400);
  }

  if (!jsonData || typeof jsonData !== 'object' || Array.isArray(jsonData)) {
    throw makeSeedError('JSON root must be an object', 400);
  }

  return jsonData as SeedFilePayload;
};

/**
 * Validate individual user payload.
 */
const validateUserPayload = (user: Partial<SeedUserPayload>, index: number): void => {
  if (typeof user.name !== 'string' || user.name.trim() === '') {
    throw makeSeedError(`User #${index}: name is required`, 400);
  }

  if (typeof user.email !== 'string' || user.email.trim() === '') {
    throw makeSeedError(`User #${index}: email is required`, 400);
  }

  if (!isValidEmail(user.email)) {
    throw makeSeedError(`User #${index}: email is invalid`, 400);
  }

  if (typeof user.password !== 'string' || user.password.trim() === '') {
    throw makeSeedError(`User #${index}: password is required`, 400);
  }

  if (user.password.length < MIN_PASSWORD_LENGTH) {
    throw makeSeedError(`User #${index}: password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }

  if (!user.role || !Object.values(UserRole).includes(user.role as UserRole)) {
    throw makeSeedError(`User #${index}: role must be ADMIN or REQUEST_MANAGER`, 400);
  }
};

/**
 * Validate individual clinic payload.
 */
const validateClinicPayload = (clinic: Partial<SeedClinicPayload>, index: number): void => {
  if (typeof clinic.name !== 'string' || clinic.name.trim() === '') {
    throw makeSeedError(`Clinic #${index}: name is required`, 400);
  }

  if (typeof clinic.nit !== 'string' || clinic.nit.trim() === '') {
    throw makeSeedError(`Clinic #${index}: nit is required`, 400);
  }

  if (typeof clinic.responsibleUserEmail !== 'string' || clinic.responsibleUserEmail.trim() === '') {
    throw makeSeedError(`Clinic #${index}: responsibleUserEmail is required`, 400);
  }
};

/**
 * Validate individual warehouse payload.
 */
const validateWarehousePayload = (warehouse: Partial<SeedWarehousePayload>, index: number): void => {
  if (typeof warehouse.name !== 'string' || warehouse.name.trim() === '') {
    throw makeSeedError(`Warehouse #${index}: name is required`, 400);
  }

  if (typeof warehouse.location !== 'string' || warehouse.location.trim() === '') {
    throw makeSeedError(`Warehouse #${index}: location is required`, 400);
  }
};

/**
 * Validate individual medicine payload.
 */
const validateMedicinePayload = (medicine: Partial<SeedMedicinePayload>, index: number): void => {
  if (typeof medicine.name !== 'string' || medicine.name.trim() === '') {
    throw makeSeedError(`Medicine #${index}: name is required`, 400);
  }
};

/**
 * Validate individual warehouseMedicine payload.
 */
const validateWarehouseMedicinePayload = (warehouseMedicine: Partial<SeedWarehouseMedicinePayload>, index: number): void => {
  if (typeof warehouseMedicine.warehouseName !== 'string' || warehouseMedicine.warehouseName.trim() === '') {
    throw makeSeedError(`WarehouseMedicine #${index}: warehouseName is required`, 400);
  }

  /** Process the uploaded seed file in one database transaction. */
  if (typeof warehouseMedicine.medicineName !== 'string' || warehouseMedicine.medicineName.trim() === '') {
    throw makeSeedError(`WarehouseMedicine #${index}: medicineName is required`, 400);
  }

  if (typeof warehouseMedicine.stock !== 'number' || !Number.isInteger(warehouseMedicine.stock)) {
    throw makeSeedError(`WarehouseMedicine #${index}: stock must be an integer`, 400);
  }

  if (warehouseMedicine.stock < 0) {
    throw makeSeedError(`WarehouseMedicine #${index}: stock must be >= 0`, 400);
  }
};

/**
 * Processes dependent seed entities in creation order within one transaction.
 * A later failure rolls back all prior inserts, preventing partial reference
 * data such as clinics without their responsible users or inventory without
 * its warehouse and medicine.
 */
export const processSeedFile = async (fileBuffer: Buffer): Promise<SeedResult> => {
  const seedData = parseJsonFile(fileBuffer);

  return sequelize.transaction(async (transaction: Transaction) => {
    const createdCounts = {
      users: 0,
      clinics: 0,
      warehouses: 0,
      medicines: 0,
      warehouseMedicines: 0,
    };

    const userEmailMap = new Map<string, number>(); // email → user ID
    const warehouseNameMap = new Map<string, number>(); // name → warehouse ID
    const medicineNameMap = new Map<string, number>(); // name → medicine ID

    // 1. Process Users
    if (Array.isArray(seedData.users)) {
      for (let i = 0; i < seedData.users.length; i++) {
        const userPayload = seedData.users[i];
        validateUserPayload(userPayload, i);

        const normalizedEmail = normalizeEmail(userPayload.email);

        // Check for duplicate in uploaded data
        if (userEmailMap.has(normalizedEmail)) {
          throw makeSeedError(`User #${i}: duplicate email in uploaded file`, 409);
        }

        // Reuse existing user instead of failing when email already exists
        const existingUser = await User.findOne({
          where: { email: normalizedEmail },
          paranoid: false,
          transaction,
        });

        if (existingUser) {
          userEmailMap.set(normalizedEmail, existingUser.id);
          continue;
        }

        const passwordHash = await bcrypt.hash(userPayload.password, BCRYPT_SALT_ROUNDS);

        const createdUser = await User.create(
          {
            name: userPayload.name.trim(),
            email: normalizedEmail,
            password: passwordHash,
            role: userPayload.role as UserRole,
          },
          { transaction }
        );

        userEmailMap.set(normalizedEmail, createdUser.id);
        createdCounts.users++;
      }
    }

    // 2. Process Clinics
    if (Array.isArray(seedData.clinics)) {
      for (let i = 0; i < seedData.clinics.length; i++) {
        const clinicPayload = seedData.clinics[i];
        validateClinicPayload(clinicPayload, i);

        // Resolve responsible user
        const userEmail = normalizeEmail(clinicPayload.responsibleUserEmail);
        const userId = userEmailMap.get(userEmail);

        if (!userId) {
          // Check if user exists in database
          const existingUser = await User.findOne({
            where: { email: userEmail },
            paranoid: false,
            transaction,
          });

          if (!existingUser || existingUser.deletedAt) {
            throw makeSeedError(`Clinic #${i}: responsibleUserEmail not found or is deleted`, 404);
          }

          // User exists but wasn't in the uploaded data
          const userIdFromDb = existingUser.id;
          userEmailMap.set(userEmail, userIdFromDb);
        }

        const finalUserId = userEmailMap.get(userEmail)!;

        // Check for duplicate NIT
        const existingClinic = await Clinic.findOne({
          where: { nit: clinicPayload.nit.trim() },
          paranoid: false,
          transaction,
        });

        if (existingClinic) {
          throw makeSeedError(`Clinic #${i}: NIT already exists`, 409);
        }

        await Clinic.create(
          {
            name: clinicPayload.name.trim(),
            nit: clinicPayload.nit.trim(),
            responsibleUserId: finalUserId,
          },
          { transaction }
        );

        createdCounts.clinics++;
      }
    }

    // 3. Process Warehouses
    if (Array.isArray(seedData.warehouses)) {
      for (let i = 0; i < seedData.warehouses.length; i++) {
        const warehousePayload = seedData.warehouses[i];
        validateWarehousePayload(warehousePayload, i);

        const warehouseName = warehousePayload.name.trim();

        // Check for duplicate in uploaded data
        if (warehouseNameMap.has(warehouseName)) {
          throw makeSeedError(`Warehouse #${i}: duplicate name in uploaded file`, 409);
        }

        const createdWarehouse = await Warehouse.create(
          {
            name: warehouseName,
            location: warehousePayload.location.trim(),
          },
          { transaction }
        );

        warehouseNameMap.set(warehouseName, createdWarehouse.id);
        createdCounts.warehouses++;
      }
    }

    // 4. Process Medicines
    if (Array.isArray(seedData.medicines)) {
      for (let i = 0; i < seedData.medicines.length; i++) {
        const medicinePayload = seedData.medicines[i];
        validateMedicinePayload(medicinePayload, i);

        const medicineName = medicinePayload.name.trim();

        // Check for duplicate in uploaded data
        if (medicineNameMap.has(medicineName)) {
          throw makeSeedError(`Medicine #${i}: duplicate name in uploaded file`, 409);
        }

        const createdMedicine = await Medicine.create(
          {
            name: medicineName,
            description: medicinePayload.description || null,
          },
          { transaction }
        );

        medicineNameMap.set(medicineName, createdMedicine.id);
        createdCounts.medicines++;
      }
    }

    // 5. Process WarehouseMedicines
    if (Array.isArray(seedData.warehouseMedicines)) {
      for (let i = 0; i < seedData.warehouseMedicines.length; i++) {
        const warehouseMedicinePayload = seedData.warehouseMedicines[i];
        validateWarehouseMedicinePayload(warehouseMedicinePayload, i);

        const warehouseId = warehouseNameMap.get(warehouseMedicinePayload.warehouseName.trim());
        if (!warehouseId) {
          throw makeSeedError(`WarehouseMedicine #${i}: warehouse not found`, 404);
        }

        const medicineId = medicineNameMap.get(warehouseMedicinePayload.medicineName.trim());
        if (!medicineId) {
          throw makeSeedError(`WarehouseMedicine #${i}: medicine not found`, 404);
        }

        // Check for duplicate (warehouseId, medicineId) pair
        const existingRecord = await WarehouseMedicine.findOne({
          where: { warehouseId, medicineId },
          paranoid: false,
          transaction,
        });

        if (existingRecord) {
          throw makeSeedError(`WarehouseMedicine #${i}: warehouse-medicine combination already exists`, 409);
        }

        await WarehouseMedicine.create(
          {
            warehouseId,
            medicineId,
            stock: warehouseMedicinePayload.stock,
          },
          { transaction }
        );

        createdCounts.warehouseMedicines++;
      }
    }

    return {
      message: 'Seed data uploaded successfully',
      created: createdCounts,
    };
  });
};
