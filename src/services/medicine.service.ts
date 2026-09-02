import Medicine from '../models/medicine.model';

/** Fields accepted when creating or partially updating a medicine. */
export interface MedicinePayload {
  name?: string;
  description?: string | null;
}

/** Public medicine representation returned by this service. */
export interface MedicineResponse {
  id: number;
  name: string;
  description: string | null;
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

const validateRequiredString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw makeServiceError(`${fieldName} is required`, 400);
  }

  return value.trim();
};

const normalizeDescription = (value: unknown): string | null => {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw makeServiceError('Medicine description must be a string', 400);
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : trimmedValue;
};

const validateId = (value: number | undefined, fieldName: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw makeServiceError(`${fieldName} is invalid`, 400);
  }

  return value;
};

const serializeMedicine = (medicine: Medicine): MedicineResponse => ({
  id: medicine.id,
  name: medicine.name,
  description: medicine.description,
  createdAt: medicine.createdAt,
  updatedAt: medicine.updatedAt,
});

/**
 * Validate and create a medicine.
 * @param payload Medicine name and optional description.
 * @returns The created medicine.
 * @throws {ServiceError} When the name or description has an invalid format.
 */
export const createMedicine = async (payload: MedicinePayload): Promise<MedicineResponse> => {
  const name = validateRequiredString(payload.name, 'Medicine name');
  const description = normalizeDescription(payload.description);

  const medicine = await Medicine.create({
    name,
    description,
  });

  return serializeMedicine(medicine);
};

/**
 * List active medicines ordered from newest to oldest.
 * @returns The serialized list of active medicines.
 */
export const listMedicines = async (): Promise<MedicineResponse[]> => {
  const medicines = await Medicine.findAll({
    order: [['createdAt', 'DESC']],
  });

  return medicines.map(serializeMedicine);
};

/**
 * Find and serialize one active medicine by ID.
 * @param medicineId Identifier of the medicine to retrieve.
 * @returns The requested medicine.
 * @throws {ServiceError} When the identifier is invalid or the medicine does not exist.
 */
export const getMedicineById = async (medicineId: number): Promise<MedicineResponse> => {
  const validMedicineId = validateId(medicineId, 'Medicine ID');

  const medicine = await Medicine.findByPk(validMedicineId);

  if (!medicine) {
    throw makeServiceError('Medicine not found', 404);
  }

  return serializeMedicine(medicine);
};

/**
 * Update the editable fields of an active medicine.
 * @param medicineId Identifier of the medicine to update.
 * @param payload Fields to update.
 * @returns The updated medicine.
 * @throws {ServiceError} When no editable field is supplied or a field is invalid.
 */
export const updateMedicine = async (medicineId: number, payload: MedicinePayload): Promise<MedicineResponse> => {
  const validMedicineId = validateId(medicineId, 'Medicine ID');

  const medicine = await Medicine.findByPk(validMedicineId, { paranoid: false });

  if (!medicine || medicine.deletedAt) {
    throw makeServiceError('Medicine not found', 404);
  }

  const nextPayload: Partial<MedicinePayload> = {};

  if (payload.name !== undefined) {
    nextPayload.name = validateRequiredString(payload.name, 'Medicine name');
  }

  if (payload.description !== undefined) {
    nextPayload.description = normalizeDescription(payload.description);
  }

  if (Object.keys(nextPayload).length === 0) {
    throw makeServiceError('No valid medicine fields were provided', 400);
  }

  await medicine.update(nextPayload);

  return serializeMedicine(medicine);
};

/**
 * Soft-delete an active medicine.
 * @param medicineId Identifier of the medicine to delete.
 * @returns A success message.
 * @throws {ServiceError} When the identifier is invalid or the medicine is already unavailable.
 */
export const deleteMedicine = async (medicineId: number): Promise<{ message: string }> => {
  const validMedicineId = validateId(medicineId, 'Medicine ID');

  const medicine = await Medicine.findByPk(validMedicineId, { paranoid: false });

  if (!medicine || medicine.deletedAt) {
    throw makeServiceError('Medicine not found', 404);
  }

  await medicine.destroy();

  return { message: 'Medicine deleted successfully' };
};
