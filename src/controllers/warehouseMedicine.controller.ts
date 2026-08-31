import { Request, Response } from 'express';
import * as warehouseMedicineService from '../services/warehouseMedicine.service';

interface ServiceError extends Error {
  statusCode?: number;
}

const handleControllerError = (error: unknown, res: Response): void => {
  const serviceError = error as ServiceError;
  const statusCode = serviceError?.statusCode ?? 500;
  const message = serviceError?.message ?? 'An unexpected error occurred';

  res.status(statusCode).json({ message });
};

export const createWarehouseMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await warehouseMedicineService.createWarehouseMedicine(req.body);
    res.status(201).json({ message: 'Warehouse medicine created successfully', data: record });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const listWarehouseMedicines = async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await warehouseMedicineService.listWarehouseMedicines();
    res.status(200).json({ data: records });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getWarehouseMedicineById = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouseMedicineId = Number(req.params.id);
    const record = await warehouseMedicineService.getWarehouseMedicineById(warehouseMedicineId);
    res.status(200).json({ data: record });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const updateWarehouseMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouseMedicineId = Number(req.params.id);
    const record = await warehouseMedicineService.updateWarehouseMedicine(warehouseMedicineId, req.body);
    res.status(200).json({ message: 'Warehouse medicine updated successfully', data: record });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const deleteWarehouseMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouseMedicineId = Number(req.params.id);
    const result = await warehouseMedicineService.deleteWarehouseMedicine(warehouseMedicineId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
};
