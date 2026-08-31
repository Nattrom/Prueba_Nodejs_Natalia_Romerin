import Warehouse from '../models/warehouse.model';

export interface WarehousePayload {
  name?: string;
  location?: string;
}

export interface WarehouseResponse {
  id: number;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

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

const validateId = (value: number | undefined, fieldName: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw makeServiceError(`${fieldName} is invalid`, 400);
  }

  return value;
};

const serializeWarehouse = (warehouse: Warehouse): WarehouseResponse => ({
  id: warehouse.id,
  name: warehouse.name,
  location: warehouse.location,
  createdAt: warehouse.createdAt,
  updatedAt: warehouse.updatedAt,
});

export const createWarehouse = async (payload: WarehousePayload): Promise<WarehouseResponse> => {
  const name = validateRequiredString(payload.name, 'Warehouse name');
  const location = validateRequiredString(payload.location, 'Warehouse location');

  const warehouse = await Warehouse.create({ name, location });

  return serializeWarehouse(warehouse);
};

export const listWarehouses = async (): Promise<WarehouseResponse[]> => {
  const warehouses = await Warehouse.findAll({
    order: [['createdAt', 'DESC']],
  });

  return warehouses.map(serializeWarehouse);
};

export const getWarehouseById = async (warehouseId: number): Promise<WarehouseResponse> => {
  const validWarehouseId = validateId(warehouseId, 'Warehouse ID');

  const warehouse = await Warehouse.findByPk(validWarehouseId);

  if (!warehouse) {
    throw makeServiceError('Warehouse not found', 404);
  }

  return serializeWarehouse(warehouse);
};

export const updateWarehouse = async (warehouseId: number, payload: WarehousePayload): Promise<WarehouseResponse> => {
  const validWarehouseId = validateId(warehouseId, 'Warehouse ID');

  const warehouse = await Warehouse.findByPk(validWarehouseId, { paranoid: false });

  if (!warehouse || warehouse.deletedAt) {
    throw makeServiceError('Warehouse not found', 404);
  }

  const nextPayload: Partial<WarehousePayload> = {};

  if (payload.name !== undefined) {
    nextPayload.name = validateRequiredString(payload.name, 'Warehouse name');
  }

  if (payload.location !== undefined) {
    nextPayload.location = validateRequiredString(payload.location, 'Warehouse location');
  }

  if (Object.keys(nextPayload).length === 0) {
    throw makeServiceError('No valid warehouse fields were provided', 400);
  }

  await warehouse.update(nextPayload);

  return serializeWarehouse(warehouse);
};

export const deleteWarehouse = async (warehouseId: number): Promise<{ message: string }> => {
  const validWarehouseId = validateId(warehouseId, 'Warehouse ID');

  const warehouse = await Warehouse.findByPk(validWarehouseId, { paranoid: false });

  if (!warehouse || warehouse.deletedAt) {
    throw makeServiceError('Warehouse not found', 404);
  }

  await warehouse.destroy();

  return { message: 'Warehouse deleted successfully' };
};
