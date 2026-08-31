import { Request, Response } from 'express';
import * as warehouseService from '../services/warehouse.service';

interface ServiceError extends Error {
  statusCode?: number;
}

const handleControllerError = (error: unknown, res: Response): void => {
  const serviceError = error as ServiceError;
  const statusCode = serviceError?.statusCode ?? 500;
  const message = serviceError?.message ?? 'An unexpected error occurred';

  res.status(statusCode).json({ message });
};

export const createWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);
    res.status(201).json({ message: 'Warehouse created successfully', data: warehouse });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const listWarehouses = async (_req: Request, res: Response): Promise<void> => {
  try {
    const warehouses = await warehouseService.listWarehouses();
    res.status(200).json({ data: warehouses });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getWarehouseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouseId = Number(req.params.id);
    const warehouse = await warehouseService.getWarehouseById(warehouseId);
    res.status(200).json({ data: warehouse });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const updateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouseId = Number(req.params.id);
    const warehouse = await warehouseService.updateWarehouse(warehouseId, req.body);
    res.status(200).json({ message: 'Warehouse updated successfully', data: warehouse });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const deleteWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouseId = Number(req.params.id);
    const result = await warehouseService.deleteWarehouse(warehouseId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
};
