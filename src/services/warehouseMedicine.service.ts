import Warehouse from '../models/warehouse.model';
import Medicine from '../models/medicine.model';
import WarehouseMedicine from '../models/warehouseMedicine.model';

/** Fields accepted when creating or partially updating an inventory record. */
export interface WarehouseMedicinePayload {
  warehouseId?: number;
  medicineId?: number;
  stock?: number;
}

/** Inventory record with optional summaries of its related warehouse and medicine. */
export interface WarehouseMedicineResponse {
  id: number;
  warehouseId: number;
  medicineId: number;
  stock: number;
  warehouse?: {
    id: number;
    name: string;
    location: string;
  };
  medicine?: {
    id: number;
    name: string;
    description: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

/** Error enriched with the HTTP status expected by controllers. */
interface ServiceError extends Error {
  statusCode: number;
}

const makeServiceError = (message: string, statusCode: number): ServiceError => {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  return error;
};

const validatePositiveInteger = (value: number | undefined, fieldName: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw makeServiceError(`${fieldName} is invalid`, 400);
  }

  return value;
};

const validateStock = (value: number | undefined): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw makeServiceError('Stock must be a non-negative integer', 400);
  }

  return value;
};

const validateId = (value: number | undefined, fieldName: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw makeServiceError(`${fieldName} is invalid`, 400);
  }

  return value;
};

const getActiveWarehouseById = async (warehouseId: number): Promise<Warehouse> => {
  const warehouse = await Warehouse.findByPk(warehouseId);

  if (!warehouse) {
    throw makeServiceError('Warehouse not found', 404);
  }

  return warehouse;
};

const getActiveMedicineById = async (medicineId: number): Promise<Medicine> => {
  const medicine = await Medicine.findByPk(medicineId);

  if (!medicine) {
    throw makeServiceError('Medicine not found', 404);
  }

  return medicine;
};

type WarehouseMedicineWithAssociations = WarehouseMedicine & {
  warehouse?: Warehouse & { deletedAt?: Date | null };
  medicine?: Medicine & { deletedAt?: Date | null };
};

const serializeWarehouseMedicine = (entry: WarehouseMedicineWithAssociations): WarehouseMedicineResponse => ({
  id: entry.id,
  warehouseId: entry.warehouseId,
  medicineId: entry.medicineId,
  stock: entry.stock,
  warehouse: entry.warehouse
    ? {
        id: entry.warehouse.id,
        name: entry.warehouse.name,
        location: entry.warehouse.location,
      }
    : undefined,
  medicine: entry.medicine
    ? {
        id: entry.medicine.id,
        name: entry.medicine.name,
        description: entry.medicine.description,
      }
    : undefined,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});

const assertUniqueWarehouseMedicine = async (warehouseId: number, medicineId: number, currentId?: number): Promise<void> => {
  const existingEntry = await WarehouseMedicine.findOne({
    where: {
      warehouseId,
      medicineId,
    },
  });

  if (existingEntry && (!currentId || existingEntry.id !== currentId)) {
    throw makeServiceError('A warehouse-medicine inventory record already exists for this warehouse and medicine', 409);
  }
};

/**
 * Validate references and create an inventory record.
 * @param payload Warehouse, medicine, and initial stock values.
 * @returns The created inventory record.
 * @throws {ServiceError} When references are absent, stock is invalid, or the pair already exists.
 */
export const createWarehouseMedicine = async (payload: WarehouseMedicinePayload): Promise<WarehouseMedicineResponse> => {
  const warehouseId = validatePositiveInteger(payload.warehouseId, 'Warehouse ID');
  const medicineId = validatePositiveInteger(payload.medicineId, 'Medicine ID');
  const stock = validateStock(payload.stock);

  await getActiveWarehouseById(warehouseId);
  await getActiveMedicineById(medicineId);
  await assertUniqueWarehouseMedicine(warehouseId, medicineId);

  const warehouseMedicine = await WarehouseMedicine.create({
    warehouseId,
    medicineId,
    stock,
  });

  const createdEntry = (await WarehouseMedicine.findByPk(warehouseMedicine.id, {
    include: [
      { association: 'warehouse', attributes: ['id', 'name', 'location'] },
      { association: 'medicine', attributes: ['id', 'name', 'description'] },
    ],
  })) as WarehouseMedicineWithAssociations | null;

  if (!createdEntry) {
    throw makeServiceError('Warehouse medicine could not be created', 500);
  }

  return serializeWarehouseMedicine(createdEntry);
};

/**
 * List inventory records whose warehouse and medicine are active.
 * @returns The serialized active inventory records.
 * @remarks Entries linked to soft-deleted warehouses or medicines are omitted.
 */
export const listWarehouseMedicines = async (): Promise<WarehouseMedicineResponse[]> => {
  const entries = (await WarehouseMedicine.findAll({
    include: [
      { association: 'warehouse', attributes: ['id', 'name', 'location'] },
      { association: 'medicine', attributes: ['id', 'name', 'description'] },
    ],
    order: [['createdAt', 'DESC']],
  })) as WarehouseMedicineWithAssociations[];

  const activeEntries = entries.filter((entry) => {
    const warehouseIsActive = !!entry.warehouse && !entry.warehouse.deletedAt;
    const medicineIsActive = !!entry.medicine && !entry.medicine.deletedAt;
    return warehouseIsActive && medicineIsActive;
  });

  return activeEntries.map(serializeWarehouseMedicine);
};

/**
 * Find and serialize one active inventory record by ID.
 * @param warehouseMedicineId Identifier of the inventory record.
 * @returns The requested inventory record.
 * @throws {ServiceError} When the identifier is invalid, absent, or linked to inactive data.
 */
export const getWarehouseMedicineById = async (warehouseMedicineId: number): Promise<WarehouseMedicineResponse> => {
  const validWarehouseMedicineId = validateId(warehouseMedicineId, 'Warehouse medicine ID');

  const entry = (await WarehouseMedicine.findByPk(validWarehouseMedicineId, {
    include: [
      { association: 'warehouse', attributes: ['id', 'name', 'location', 'deletedAt'] },
      { association: 'medicine', attributes: ['id', 'name', 'description', 'deletedAt'] },
    ],
  })) as WarehouseMedicineWithAssociations | null;

  if (!entry) {
    throw makeServiceError('Warehouse medicine not found', 404);
  }

  const warehouseIsActive = !!entry.warehouse && !entry.warehouse.deletedAt;
  const medicineIsActive = !!entry.medicine && !entry.medicine.deletedAt;

  if (!warehouseIsActive || !medicineIsActive) {
    throw makeServiceError('Warehouse medicine not found', 404);
  }

  return serializeWarehouseMedicine(entry);
};

/**
 * Update an inventory record after validating its references and stock.
 * @param warehouseMedicineId Identifier of the inventory record to update.
 * @param payload Fields to update.
 * @returns The updated inventory record.
 * @throws {ServiceError} When no field is supplied, validation fails, or the resulting pair is duplicated.
 */
export const updateWarehouseMedicine = async (
  warehouseMedicineId: number,
  payload: WarehouseMedicinePayload,
): Promise<WarehouseMedicineResponse> => {
  const validWarehouseMedicineId = validateId(warehouseMedicineId, 'Warehouse medicine ID');

  const entry = await WarehouseMedicine.findByPk(validWarehouseMedicineId);

  if (!entry) {
    throw makeServiceError('Warehouse medicine not found', 404);
  }

  const nextPayload: Partial<WarehouseMedicinePayload> = {};

  if (payload.warehouseId !== undefined) {
    nextPayload.warehouseId = validatePositiveInteger(payload.warehouseId, 'Warehouse ID');
  }

  if (payload.medicineId !== undefined) {
    nextPayload.medicineId = validatePositiveInteger(payload.medicineId, 'Medicine ID');
  }

  if (payload.stock !== undefined) {
    nextPayload.stock = validateStock(payload.stock);
  }

  if (Object.keys(nextPayload).length === 0) {
    throw makeServiceError('No valid warehouse medicine fields were provided', 400);
  }

  const warehouseIdToUse = nextPayload.warehouseId ?? entry.warehouseId;
  const medicineIdToUse = nextPayload.medicineId ?? entry.medicineId;

  if (nextPayload.warehouseId !== undefined) {
    await getActiveWarehouseById(nextPayload.warehouseId);
  }

  if (nextPayload.medicineId !== undefined) {
    await getActiveMedicineById(nextPayload.medicineId);
  }

  await assertUniqueWarehouseMedicine(warehouseIdToUse, medicineIdToUse, validWarehouseMedicineId);

  await entry.update(nextPayload);

  const updatedEntry = (await WarehouseMedicine.findByPk(entry.id, {
    include: [
      { association: 'warehouse', attributes: ['id', 'name', 'location'] },
      { association: 'medicine', attributes: ['id', 'name', 'description'] },
    ],
  })) as WarehouseMedicineWithAssociations | null;

  if (!updatedEntry) {
    throw makeServiceError('Warehouse medicine not found', 404);
  }

  return serializeWarehouseMedicine(updatedEntry);
};

/**
 * Soft-delete an active inventory record.
 * @param warehouseMedicineId Identifier of the inventory record to delete.
 * @returns A success message.
 * @throws {ServiceError} When the identifier is invalid or the record does not exist.
 */
export const deleteWarehouseMedicine = async (warehouseMedicineId: number): Promise<{ message: string }> => {
  const validWarehouseMedicineId = validateId(warehouseMedicineId, 'Warehouse medicine ID');

  const entry = await WarehouseMedicine.findByPk(validWarehouseMedicineId);

  if (!entry) {
    throw makeServiceError('Warehouse medicine not found', 404);
  }

  await entry.destroy();

  return { message: 'Warehouse medicine deleted successfully' };
};
