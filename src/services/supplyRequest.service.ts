import { Transaction } from 'sequelize';
import sequelize from '../config/database';
import SupplyRequest, { RequestStatus } from '../models/supplyRequest.model';
import Clinic from '../models/clinic.model';
import Medicine from '../models/medicine.model';
import Warehouse from '../models/warehouse.model';
import WarehouseMedicine from '../models/warehouseMedicine.model';

/** Data required to create a pending medicine supply request. */
export interface CreateSupplyRequestPayload {
  clinicId?: number;
  medicineId?: number;
  warehouseId?: number;
  quantity?: number;
  notes?: string | null;
}

/** New lifecycle status requested for an existing supply request. */
export interface UpdateSupplyRequestStatusPayload {
  status?: string;
}

/** Supply request returned with optional summaries of its related entities. */
export interface SupplyRequestResponse {
  id: number;
  clinicId: number;
  medicineId: number;
  warehouseId: number;
  quantity: number;
  status: RequestStatus;
  notes: string | null;
  clinic?: {
    id: number;
    name: string;
    nit: string;
  };
  medicine?: {
    id: number;
    name: string;
    description: string | null;
  };
  warehouse?: {
    id: number;
    name: string;
    location: string;
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

const validateQuantity = (value: number | undefined): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw makeServiceError('Quantity must be an integer greater than zero', 400);
  }

  return value;
};

const validateStatus = (value: string | undefined): RequestStatus => {
  if (typeof value !== 'string' || !Object.values(RequestStatus).includes(value as RequestStatus)) {
    throw makeServiceError('Invalid status value', 400);
  }

  return value as RequestStatus;
};

const getActiveClinicsById = async (clinicId: number): Promise<Clinic> => {
  const clinic = await Clinic.findByPk(clinicId);

  if (!clinic) {
    throw makeServiceError('Clinic not found', 404);
  }

  return clinic;
};

const getActiveMedicineById = async (medicineId: number): Promise<Medicine> => {
  const medicine = await Medicine.findByPk(medicineId);

  if (!medicine) {
    throw makeServiceError('Medicine not found', 404);
  }

  return medicine;
};

const getActiveWarehouseById = async (warehouseId: number): Promise<Warehouse> => {
  const warehouse = await Warehouse.findByPk(warehouseId);

  if (!warehouse) {
    throw makeServiceError('Warehouse not found', 404);
  }

  return warehouse;
};

const getWarehouseMedicineByPk = async (warehouseId: number, medicineId: number): Promise<WarehouseMedicine> => {
  const warehouseMedicine = await WarehouseMedicine.findOne({
    where: { warehouseId, medicineId },
  });

  if (!warehouseMedicine) {
    throw makeServiceError('Inventory record for this warehouse and medicine not found', 404);
  }

  return warehouseMedicine;
};

const serializeSupplyRequest = (
  request: SupplyRequest & {
    clinic?: Clinic;
    medicine?: Medicine;
    warehouse?: Warehouse;
  }
): SupplyRequestResponse => ({
  id: request.id,
  clinicId: request.clinicId,
  medicineId: request.medicineId,
  warehouseId: request.warehouseId,
  quantity: request.quantity,
  status: request.status,
  notes: request.notes,
  clinic: request.clinic
    ? {
        id: request.clinic.id,
        name: request.clinic.name,
        nit: request.clinic.nit,
      }
    : undefined,
  medicine: request.medicine
    ? {
        id: request.medicine.id,
        name: request.medicine.name,
        description: request.medicine.description,
      }
    : undefined,
  warehouse: request.warehouse
    ? {
        id: request.warehouse.id,
        name: request.warehouse.name,
        location: request.warehouse.location,
      }
    : undefined,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

/**
 * Create a new supply request.
 * The request is created with PENDING status.
 * Stock is NOT reserved at creation time.
 * @param payload Clinic, medicine, warehouse, quantity, and optional notes.
 * @returns The created pending supply request with related entities.
 * @throws {ServiceError} When a reference is missing, quantity is invalid, or current stock is insufficient.
 */
export const createSupplyRequest = async (payload: CreateSupplyRequestPayload): Promise<SupplyRequestResponse> => {
  const clinicId = validatePositiveInteger(payload.clinicId, 'Clinic ID');
  const medicineId = validatePositiveInteger(payload.medicineId, 'Medicine ID');
  const warehouseId = validatePositiveInteger(payload.warehouseId, 'Warehouse ID');
  const quantity = validateQuantity(payload.quantity);

  // Verify all related entities exist and are active
  await getActiveClinicsById(clinicId);
  await getActiveMedicineById(medicineId);
  await getActiveWarehouseById(warehouseId);

  // Verify inventory record exists
  await getWarehouseMedicineByPk(warehouseId, medicineId);

  // Verify sufficient stock (informational check only - no reservation)
  const warehouseMedicine = await WarehouseMedicine.findOne({
    where: { warehouseId, medicineId },
  });

  if (!warehouseMedicine || warehouseMedicine.stock < quantity) {
    throw makeServiceError('Insufficient stock available', 400);
  }

  // Create the request in PENDING status
  const supplyRequest = await SupplyRequest.create({
    clinicId,
    medicineId,
    warehouseId,
    quantity,
    status: RequestStatus.PENDING,
    notes: payload.notes || null,
  });

  // Fetch with associations for response
  const createdRequest = (await SupplyRequest.findByPk(supplyRequest.id, {
    include: [
      { association: 'clinic', attributes: ['id', 'name', 'nit'] },
      { association: 'medicine', attributes: ['id', 'name', 'description'] },
      { association: 'warehouse', attributes: ['id', 'name', 'location'] },
    ],
  })) as SupplyRequest & {
    clinic?: Clinic;
    medicine?: Medicine;
    warehouse?: Warehouse;
  };

  return serializeSupplyRequest(createdRequest);
};

/**
 * List all active supply requests (non-deleted).
 * ADMIN only.
 * @returns The serialized active supply requests.
 */
export const listAllSupplyRequests = async (): Promise<SupplyRequestResponse[]> => {
  const requests = (await SupplyRequest.findAll({
    include: [
      { association: 'clinic', attributes: ['id', 'name', 'nit'] },
      { association: 'medicine', attributes: ['id', 'name', 'description'] },
      { association: 'warehouse', attributes: ['id', 'name', 'location'] },
    ],
    order: [['createdAt', 'DESC']],
  })) as (SupplyRequest & {
    clinic?: Clinic;
    medicine?: Medicine;
    warehouse?: Warehouse;
  })[];

  return requests.map(serializeSupplyRequest);
};

/**
 * List active/non-terminal requests (PENDING, APPROVED).
 * ADMIN or REQUEST_MANAGER.
 * @returns The serialized active supply requests.
 */
export const listActiveSupplyRequests = async (): Promise<SupplyRequestResponse[]> => {
  const requests = (await SupplyRequest.findAll({
    where: {
      status: [RequestStatus.PENDING, RequestStatus.APPROVED],
    },
    include: [
      { association: 'clinic', attributes: ['id', 'name', 'nit'] },
      { association: 'medicine', attributes: ['id', 'name', 'description'] },
      { association: 'warehouse', attributes: ['id', 'name', 'location'] },
    ],
    order: [['createdAt', 'DESC']],
  })) as (SupplyRequest & {
    clinic?: Clinic;
    medicine?: Medicine;
    warehouse?: Warehouse;
  })[];

  return requests.map(serializeSupplyRequest);
};

/**
 * Get request history for a specific clinic (all statuses).
 * @param clinicId Identifier of the clinic whose history is requested.
 * @returns The clinic's supply request history.
 * @throws {ServiceError} When the clinic identifier is invalid or the clinic does not exist.
 */
export const getSupplyRequestHistoryByClinic = async (clinicId: number): Promise<SupplyRequestResponse[]> => {
  const validClinicId = validatePositiveInteger(clinicId, 'Clinic ID');

  // Verify clinic exists
  await getActiveClinicsById(validClinicId);

  const requests = (await SupplyRequest.findAll({
    where: { clinicId: validClinicId },
    include: [
      { association: 'clinic', attributes: ['id', 'name', 'nit'] },
      { association: 'medicine', attributes: ['id', 'name', 'description'] },
      { association: 'warehouse', attributes: ['id', 'name', 'location'] },
    ],
    order: [['createdAt', 'DESC']],
  })) as (SupplyRequest & {
    clinic?: Clinic;
    medicine?: Medicine;
    warehouse?: Warehouse;
  })[];

  return requests.map(serializeSupplyRequest);
};

/**
 * Get supply request by ID.
 * @param supplyRequestId Identifier of the request to retrieve.
 * @returns The requested supply request with related entities.
 * @throws {ServiceError} When the identifier is invalid or the request does not exist.
 */
export const getSupplyRequestById = async (supplyRequestId: number): Promise<SupplyRequestResponse> => {
  const validSupplyRequestId = validatePositiveInteger(supplyRequestId, 'Supply request ID');

  const request = (await SupplyRequest.findByPk(validSupplyRequestId, {
    include: [
      { association: 'clinic', attributes: ['id', 'name', 'nit'] },
      { association: 'medicine', attributes: ['id', 'name', 'description'] },
      { association: 'warehouse', attributes: ['id', 'name', 'location'] },
    ],
  })) as (SupplyRequest & {
    clinic?: Clinic;
    medicine?: Medicine;
    warehouse?: Warehouse;
  }) | null;

  if (!request) {
    throw makeServiceError('Supply request not found', 404);
  }

  return serializeSupplyRequest(request);
};

/**
 * Determine whether a requested lifecycle transition is permitted.
 * Terminal states cannot transition further; approval and rejection are only
 * available from PENDING, while completion is only available from APPROVED.
 * @param currentStatus Persisted request status.
 * @param newStatus Requested status.
 * @returns Whether the transition is included in the allowed state graph.
 */
const isValidStatusTransition = (currentStatus: RequestStatus, newStatus: RequestStatus): boolean => {
  const validTransitions: Record<RequestStatus, RequestStatus[]> = {
    [RequestStatus.PENDING]: [RequestStatus.APPROVED, RequestStatus.REJECTED],
    [RequestStatus.APPROVED]: [RequestStatus.COMPLETED],
    [RequestStatus.REJECTED]: [],
    [RequestStatus.COMPLETED]: [],
  };

  return validTransitions[currentStatus].includes(newStatus);
};

/**
 * Update supply request status.
 * PENDING → APPROVED: Uses transaction with inventory locking and reduction.
 * PENDING → REJECTED: Simple status update.
 * APPROVED → COMPLETED: Simple status update.
 * @param supplyRequestId Identifier of the request to update.
 * @param payload New status for the request.
 * @returns The updated supply request with related entities.
 * @throws {ServiceError} When the request is unavailable, the transition is invalid, or approval lacks stock.
 */
export const updateSupplyRequestStatus = async (
  supplyRequestId: number,
  payload: UpdateSupplyRequestStatusPayload
): Promise<SupplyRequestResponse> => {
  const validSupplyRequestId = validatePositiveInteger(supplyRequestId, 'Supply request ID');
  const newStatus = validateStatus(payload.status);

  const request = await SupplyRequest.findByPk(validSupplyRequestId, { paranoid: false });

  if (!request || request.deletedAt) {
    throw makeServiceError('Supply request not found', 404);
  }

  // Validate transition
  if (!isValidStatusTransition(request.status, newStatus)) {
    throw makeServiceError(
      `Cannot transition from ${request.status} to ${newStatus}`,
      400
    );
  }

  // Special handling for PENDING → APPROVED: requires transaction with inventory management
  if (request.status === RequestStatus.PENDING && newStatus === RequestStatus.APPROVED) {
    return approveSupplyRequest(request);
  }

  // Simple status updates for other transitions
  await request.update({ status: newStatus });

  const updatedRequest = (await SupplyRequest.findByPk(supplyRequestId, {
    include: [
      { association: 'clinic', attributes: ['id', 'name', 'nit'] },
      { association: 'medicine', attributes: ['id', 'name', 'description'] },
      { association: 'warehouse', attributes: ['id', 'name', 'location'] },
    ],
  })) as SupplyRequest & {
    clinic?: Clinic;
    medicine?: Medicine;
    warehouse?: Warehouse;
  };

  return serializeSupplyRequest(updatedRequest);
};

/**
 * Approve supply request with transaction-based inventory management.
 * This is the critical function that prevents race conditions and ensures
 * inventory integrity. It locks the inventory row, verifies stock again,
 * decreases it, and marks the request APPROVED atomically.
 * @param request Persisted pending request to approve.
 * @returns The approved request with its related entities.
 * @throws {ServiceError} When inventory is absent or insufficient inside the transaction.
 */
const approveSupplyRequest = async (request: SupplyRequest): Promise<SupplyRequestResponse> => {
  return sequelize.transaction(async (transaction: Transaction) => {
    // Lock and fetch WarehouseMedicine record within transaction
    const warehouseMedicine = await WarehouseMedicine.findOne({
      where: {
        warehouseId: request.warehouseId,
        medicineId: request.medicineId,
      },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!warehouseMedicine) {
      throw makeServiceError('Inventory record not found during approval', 404);
    }

    // Re-check stock within transaction
    if (warehouseMedicine.stock < request.quantity) {
      throw makeServiceError('Insufficient stock available', 400);
    }

    // Reduce stock
    await warehouseMedicine.update(
      { stock: warehouseMedicine.stock - request.quantity },
      { transaction }
    );

    // Update request status to APPROVED
    await request.update(
      { status: RequestStatus.APPROVED },
      { transaction }
    );

    // Fetch and return updated request with associations
    const updatedRequest = (await SupplyRequest.findByPk(request.id, {
      include: [
        { association: 'clinic', attributes: ['id', 'name', 'nit'] },
        { association: 'medicine', attributes: ['id', 'name', 'description'] },
        { association: 'warehouse', attributes: ['id', 'name', 'location'] },
      ],
      transaction,
    })) as SupplyRequest & {
      clinic?: Clinic;
      medicine?: Medicine;
      warehouse?: Warehouse;
    };

    return serializeSupplyRequest(updatedRequest);
  });
};
